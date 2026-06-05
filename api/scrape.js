const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Firebase initialization (serverless environment এর জন্য optimize করা)
if (!admin.apps.length) {
  // Environment variable থেকে Firebase config নিবে
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// সব শেয়ারের তালিকা পাওয়ার ফাংশন
async function getAllCompanies() {
  try {
    const response = await axios.get('https://www.dsebd.org/stock_price_yesterday.php', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const companies = [];
    
    // টেবিল থেকে কোম্পানির নাম ও কোড সংগ্রহ
    $('table tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 2) {
        const code = $(tds[0]).text().trim();
        const name = $(tds[1]).text().trim();
        if (code && name && code !== 'TRADING CODE') {
          companies.push({ code, name });
        }
      }
    });
    
    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

// নির্দিষ্ট কোম্পানির বিস্তারিত তথ্য আনার ফাংশন
async function getCompanyDetails(tradingCode) {
  try {
    const url = `https://www.dsebd.org/displayCompany.php?name=${tradingCode}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const details = {};
    
    // তথ্য টেবিল থেকে ডাটা এক্সট্রাক্ট
    $('table tr').each((i, row) => {
      const th = $(row).find('th').text().trim();
      const td = $(row).find('td').text().trim();
      
      if (th && td) {
        if (th.includes('Company Name')) details.companyName = td;
        if (th.includes('Trading Code')) details.tradingCode = td;
        if (th.includes('Listing Year')) details.listingYear = td;
        if (th.includes('Paid-up Capital')) details.paidUpCapital = td;
        if (th.includes('Face Value')) details.faceValue = td;
        if (th.includes('Share Category')) details.shareCategory = td;
        if (th.includes('EPS')) details.eps = td;
        if (th.includes('NAV')) details.nav = td;
        if (th.includes('P/E Ratio')) details.peRatio = td;
        if (th.includes('Last Updated')) details.lastUpdated = td;
      }
    });
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error);
    return null;
  }
}

// মার্কেট প্রাইস আনার ফাংশন
async function getMarketPrice(tradingCode) {
  try {
    const response = await axios.get('https://www.dsebd.org/latest_share_price_scroll_l.php', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // কোম্পানির প্রাইস খোঁজা
    let priceData = {
      ltp: 'N/A',
      high: 'N/A',
      low: 'N/A',
      change: 'N/A',
      volume: 'N/A'
    };
    
    $('tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length > 1 && $(tds[0]).text().trim() === tradingCode) {
        priceData = {
          ltp: $(tds[1]).text().trim() || 'N/A',
          high: $(tds[4]).text().trim() || 'N/A',
          low: $(tds[5]).text().trim() || 'N/A',
          change: $(tds[3]).text().trim() || 'N/A',
          volume: $(tds[6]).text().trim() || 'N/A'
        };
        return false; // ব্রেক দিয়ে দিচ্ছি
      }
    });
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${tradingCode}:`, error);
    return null;
  }
}

// Vercel API handler
module.exports = async (req, res) => {
  // CORS headers (আপনার ফ্রন্টএন্ড থেকে কল করলে কাজ করবে)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, tradingCode } = req.query;
    
    // action parameter অনুযায়ী কাজ করবে
    if (action === 'companies') {
      // সব কোম্পানির তালিকা
      const companies = await getAllCompanies();
      return res.status(200).json({ success: true, data: companies });
      
    } else if (action === 'details' && tradingCode) {
      // নির্দিষ্ট কোম্পানির বিস্তারিত
      const details = await getCompanyDetails(tradingCode);
      return res.status(200).json({ success: true, data: details });
      
    } else if (action === 'price' && tradingCode) {
      // নির্দিষ্ট কোম্পানির মার্কেট প্রাইস
      const price = await getMarketPrice(tradingCode);
      return res.status(200).json({ success: true, data: price });
      
    } else if (action === 'all') {
      // সব তথ্য একসাথে (এতে সময় লাগবে)
      const companies = await getAllCompanies();
      const limitedCompanies = companies.slice(0, 10); // অনেক কোম্পানি থাকলে লিমিট করে দিন
      
      const allData = [];
      for (const company of limitedCompanies) {
        const [details, price] = await Promise.all([
          getCompanyDetails(company.code),
          getMarketPrice(company.code)
        ]);
        
        allData.push({
          ...company,
          details,
          price
        });
        
        // Ratelimit এড়াতে একটু delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return res.status(200).json({ success: true, data: allData });
      
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action. Use: companies, details, price, or all' 
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
