const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// আপনার Firebase কনফিগারেশন (সরাসরি কোডে)
const serviceAccount = {
  "type": "service_account",
  "project_id": "dse-scraper-c651b",
  "private_key_id": "5c90f5654231207278a93cc9eaeac72e5194709e",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCbu0Vlln8RNCAa\nN8eWs0P/Wk/k+mJpTLCJKhnN2a6rqXW8cGA+TE2s9G0q/I1KFHzALZlagfecj/BR\nEgOs0y9R1q7AtKkuaaja3p2Wa+nf+bDWCuFAHsaAyhIjKx1sCx1MH5/LeOf4Yreb\nMOCOH3sA7rvrleyA5i4xeeig8PJ1yDHmGrlbqZqrWsjmib37B7lhqsBGPxKSfj9j\ngpHWqv4A1fJvtsoKaCt0WyyC7wGmH5XHDnVWqc7egyAcE/Vm/p3N+TsQpRsRechS\nr5vHLHS5UJPFm2smHGQ6BQrUl9D6GoXLHEb5ctnqux7sm1rl0b953nBOlKK3Db4j\n1rFBViB/AgMBAAECggEAFQGFstZB/YgSbHbprSIxIdiEvlYnwBxgE6BiKqoaLX2G\nLAzcborMT3AI6at3Q27QBPwhm1u8kpm3yLetVzqFP3y9xbCYwXHvHNa6WvfjbBq6\nB6UgDQ4ZqHWZTLUcGt7E7Oe3HjMI1zA5o+1L3N/SL6YEIxrt89UYlgPjpRHbIpfQ\nhX5D60xYWp6b7lbb1My8G9fE8Jd+FMPIJDcboGzwupj0wB5BOmXV0MyIp3ytuAUK\npKF6VlddD3pS10BXNC2wg82V2hxqoVMg+/AoQq5ZQ2F7crxe35WiIZWz4bHxuqrO\nI6V0fCjQtd8vU+whQTtaJLPVoXWmhMt75gELrwA3QQKBgQDIvR7VvY59Ajc9NCLl\nh80TOqSS2PO1+HaebVM1R/UVkcYEwYSTCoDvhqnN6WBDwDiS/q8TuVVMvtMqvZ4K\n5YGAK685kf1jVLCM7CCthOtr+P2sV5VD5ZH6nOI1L9/I9x4ECQSxPGjP2EBviaiu\nXA2K1kshNLRuR60dIU4d838f9QKBgQDGmk7Jn/OgH43tFqLJSQxJspyC531xGO7t\n4Kk6DTAy0IxbOzLe8cxajI2mTWn8i7OAiIr3SAZV6FXFIpi2P40ycP9b20JWuzqv\nfxUuHmKDQcAOdef9NFz0aMhSw9OAWUT/XtTb45NH95up99B3yvcTggqNu0H40vB6\ngkZEiJJ6IwKBgFFza2+O2qIepAtRfFdmIvAKe3yaS0kq5/agpYKZD/kQjSig3QpM\n2MRX/85tQ4I6HLqIXMHEEbhyNXzCM754IXPARfk2I3qKgpirtxaxOFU3Urb7UrWa\nEQF/ZsnuAv+oRaWdgynnOSAcvwiC8s7MyzHqgdGXcR7ONo/7U5cTliGBAoGBAIzT\nSEDSKceF+HaAkYeXQ55Sh4aPLTTwECQfJQAj7+RoWs4qKQVLgbNHbP3acOgCC5N9\nvsRfjxaFe6Qgxxab87wrwfbZf63Ob2uX+mXMZ+BY1B2s34Z9BdjNIBcIAsZFBpbq\nIJeXRI1Id1nLfkgjZJWxpVggy0PsF1dXXwojqXHvAoGBAJZP9AKWJBaKkRFK9G8k\npyYa4p/eh/pFgpKpJQr+9ccdihIl3y4T1vJ9OTvLAPlLhYz7IfMY1ZhtPNJZuVj4\nO0IIvDMm8sWciDsVDkwFmE+FuICgYvU/PlWZhpAFQt2QZ9G38mDK446+OfvhyTJa\nGWEUjP4Ti9rjvvC5m/L3WS+t\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@dse-scraper-c651b.iam.gserviceaccount.com",
  "client_id": "114634141840338686284",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40dse-scraper-c651b.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Firebase Initialize (চেক করে নিবে আগে থেকে initialized কিনা)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// 🔥 ডিবাগ ফাংশন - Firebase সংযোগ টেস্ট
async function testFirebaseConnection() {
  try {
    const testDoc = db.collection('test').doc('connection');
    await testDoc.set({
      message: 'Firebase connected successfully!',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Firebase connected and working!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

// সব শেয়ারের তালিকা পাওয়ার ফাংশন
async function getAllCompanies() {
  try {
    console.log('📊 Fetching companies from DSE...');
    const response = await axios.get('https://www.dsebd.org/stock_price_yesterday.php', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
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
        if (code && name && code !== 'TRADING CODE' && code !== 'SCROLL FOR MORE' && code.length < 20) {
          companies.push({ code, name });
        }
      }
    });
    
    console.log(`✅ Found ${companies.length} companies`);
    return companies.slice(0, 50); // প্রথম 50টা কোম্পানি (রেট লিমিট এড়াতে)
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
    const details = {
      tradingCode: tradingCode,
      scrapedAt: new Date().toISOString()
    };
    
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
        if (th.includes('Last Updated')) details.lastUpdatedOnSite = td;
      }
    });
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error.message);
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
      tradingCode: tradingCode,
      ltp: 'N/A',
      high: 'N/A',
      low: 'N/A',
      change: 'N/A',
      volume: 'N/A',
      scrapedAt: new Date().toISOString()
    };
    
    $('tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length > 6 && $(tds[0]).text().trim() === tradingCode) {
        priceData = {
          tradingCode: tradingCode,
          ltp: $(tds[1]).text().trim() || 'N/A',
          high: $(tds[4]).text().trim() || 'N/A',
          low: $(tds[5]).text().trim() || 'N/A',
          change: $(tds[3]).text().trim() || 'N/A',
          volume: $(tds[6]).text().trim() || 'N/A',
          scrapedAt: new Date().toISOString()
        };
        return false;
      }
    });
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${tradingCode}:`, error.message);
    return null;
  }
}

// Firebase এ ডাটা সেভ করার ফাংশন
async function saveToFirebase(collection, docId, data) {
  try {
    const docRef = db.collection(collection).doc(docId);
    await docRef.set(data, { merge: true });
    console.log(`✅ Saved ${docId} to ${collection}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save ${docId}:`, error);
    return false;
  }
}

// Vercel API handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Firebase connection test
  await testFirebaseConnection();
  
  try {
    const { action, tradingCode } = req.query;
    
    console.log(`📡 Request received: action=${action}, code=${tradingCode}`);
    
    // action parameter অনুযায়ী কাজ করবে
    if (action === 'test') {
      // টেস্ট এন্ডপয়েন্ট
      return res.status(200).json({ 
        success: true, 
        message: 'DSE Scraper API is working!',
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'companies') {
      // সব কোম্পানির তালিকা
      const companies = await getAllCompanies();
      return res.status(200).json({ success: true, count: companies.length, data: companies });
      
    } else if (action === 'details' && tradingCode) {
      // নির্দিষ্ট কোম্পানির বিস্তারিত
      const details = await getCompanyDetails(tradingCode);
      if (details) {
        await saveToFirebase('company_details', tradingCode, details);
      }
      return res.status(200).json({ success: true, data: details });
      
    } else if (action === 'price' && tradingCode) {
      // নির্দিষ্ট কোম্পানির মার্কেট প্রাইস
      const price = await getMarketPrice(tradingCode);
      if (price && price.ltp !== 'N/A') {
        await saveToFirebase('market_prices', tradingCode, price);
      }
      return res.status(200).json({ success: true, data: price });
      
    } else if (action === 'all' && tradingCode) {
      // সব তথ্য একসাথে (details + price)
      const [details, price] = await Promise.all([
        getCompanyDetails(tradingCode),
        getMarketPrice(tradingCode)
      ]);
      
      const combinedData = { details, price, lastFullScrape: new Date().toISOString() };
      
      if (details) await saveToFirebase('company_details', tradingCode, details);
      if (price && price.ltp !== 'N/A') await saveToFirebase('market_prices', tradingCode, price);
      await saveToFirebase('full_data', tradingCode, combinedData);
      
      return res.status(200).json({ success: true, data: combinedData });
      
    } else if (action === 'batch') {
      // ব্যাচ প্রসেসিং (একাধিক কোম্পানি)
      const companies = await getAllCompanies();
      const results = [];
      
      for (let i = 0; i < Math.min(companies.length, 10); i++) {
        const company = companies[i];
        console.log(`Processing ${i+1}/${Math.min(companies.length, 10)}: ${company.code}`);
        
        const price = await getMarketPrice(company.code);
        if (price && price.ltp !== 'N/A') {
          await saveToFirebase('market_prices', company.code, price);
          results.push({ code: company.code, name: company.name, price: price.ltp });
        }
        
        // Rate limit এড়াতে delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return res.status(200).json({ success: true, processed: results.length, data: results });
      
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action! Available actions: test, companies, details, price, all, batch',
        example: {
          test: '/api/scrape?action=test',
          companies: '/api/scrape?action=companies',
          details: '/api/scrape?action=details&tradingCode=BATASHUR',
          price: '/api/scrape?action=price&tradingCode=BATASHUR',
          all: '/api/scrape?action=all&tradingCode=BATASHUR',
          batch: '/api/scrape?action=batch'
        }
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
