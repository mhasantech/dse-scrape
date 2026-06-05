const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// আপনার Firebase কনফিগারেশন
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

// Firebase Initialize
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// উন্নত মার্কেট প্রাইস ফাংশন
async function getMarketPrice(tradingCode) {
  try {
    // DSE এর API endpoint (যেখানে আসল ডাটা আসে)
    const response = await axios.get('https://www.dsebd.org/latest_share_price_scroll_l.php', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // বিভিন্ন পসিবল সেলেক্টর চেক করা
    let priceData = {
      tradingCode: tradingCode,
      ltp: 'N/A',
      high: 'N/A',
      low: 'N/A',
      change: 'N/A',
      volume: 'N/A',
      ycp: 'N/A',
      scrapedAt: new Date().toISOString()
    };
    
    // সব টেবিল রো চেক করা
    $('table tr, .table tr, .tblData tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 2) {
        const firstCol = $(tds[0]).text().trim();
        // ট্রেডিং কোড ম্যাচ করা (case insensitive)
        if (firstCol.toUpperCase() === tradingCode.toUpperCase()) {
          priceData = {
            tradingCode: tradingCode,
            ltp: $(tds[1]).text().trim() || 'N/A',
            change: $(tds[2]).text().trim() || 'N/A',
            ycp: $(tds[3]).text().trim() || 'N/A',
            high: $(tds[4]).text().trim() || 'N/A',
            low: $(tds[5]).text().trim() || 'N/A',
            volume: $(tds[6]).text().trim() || 'N/A',
            scrapedAt: new Date().toISOString()
          };
          return false;
        }
      }
    });
    
    // যদি না পাওয়া যায়, তাহলে পুরো HTML এ সার্চ করা
    if (priceData.ltp === 'N/A') {
      const html = $('body').text();
      const regex = new RegExp(`${tradingCode}[\\s\\S]*?(\\d+\\.?\\d*)[\\s\\S]*?(\\d+\\.?\\d*)[\\s\\S]*?(\\d+\\.?\\d*)`, 'i');
      const match = html.match(regex);
      if (match) {
        priceData.ltp = match[1] || 'N/A';
        priceData.high = match[2] || 'N/A';
        priceData.low = match[3] || 'N/A';
      }
    }
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${tradingCode}:`, error.message);
    return { tradingCode, ltp: 'Error', high: 'Error', low: 'Error', scrapedAt: new Date().toISOString() };
  }
}

// উন্নত কোম্পানি ডিটেইলস ফাংশন
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
    
    // সব টেবিল থেকে তথ্য নেওয়া
    $('table').each((tableIdx, table) => {
      $(table).find('tr').each((i, row) => {
        const cols = $(row).find('td');
        const headers = $(row).find('th');
        
        if (headers.length > 0) {
          const key = $(headers[0]).text().trim();
          const value = $(headers[1]).text().trim();
          
          if (key && value) {
            if (key.includes('Company Name')) details.companyName = value;
            if (key.includes('Trading Code')) details.tradingCode = value;
            if (key.includes('Listing Year')) details.listingYear = value;
            if (key.includes('Paid-up Capital')) details.paidUpCapital = value;
            if (key.includes('Face Value')) details.faceValue = value;
            if (key.includes('Share Category')) details.shareCategory = value;
            if (key.includes('EPS')) details.eps = value;
            if (key.includes('NAV')) details.nav = value;
            if (key.includes('P/E Ratio')) details.peRatio = value;
          }
        }
        
        if (cols.length >= 2) {
          const label = $(cols[0]).text().trim();
          const value = $(cols[1]).text().trim();
          
          if (label.includes('EPS')) details.eps = value;
          if (label.includes('NAV')) details.nav = value;
          if (label.includes('Category')) details.shareCategory = value;
          if (label.includes('Dividend')) details.dividend = value;
        }
      });
    });
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error.message);
    return { tradingCode, error: error.message, scrapedAt: new Date().toISOString() };
  }
}

// সব কোম্পানির তালিকা
async function getAllCompanies() {
  try {
    const response = await axios.get('https://www.dsebd.org/stock_price_yesterday.php', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    const companies = [];
    
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
    
    return companies.slice(0, 30);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

// API Handler
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, tradingCode } = req.query;
    
    if (action === 'test') {
      return res.status(200).json({ 
        success: true, 
        message: 'DSE Scraper API is working!',
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'companies') {
      const companies = await getAllCompanies();
      return res.status(200).json({ success: true, count: companies.length, data: companies });
      
    } else if (action === 'details' && tradingCode) {
      const details = await getCompanyDetails(tradingCode);
      return res.status(200).json({ success: true, data: details });
      
    } else if (action === 'price' && tradingCode) {
      const price = await getMarketPrice(tradingCode);
      return res.status(200).json({ success: true, data: price });
      
    } else if (action === 'all' && tradingCode) {
      const [details, price] = await Promise.all([
        getCompanyDetails(tradingCode),
        getMarketPrice(tradingCode)
      ]);
      
      // Firebase এ সেভ করুন (যদি ডাটা ভালো হয়)
      if (price.ltp !== 'N/A' && price.ltp !== 'Error') {
        try {
          await db.collection('market_prices').doc(tradingCode).set(price, { merge: true });
          await db.collection('company_details').doc(tradingCode).set(details, { merge: true });
          console.log(`✅ Saved ${tradingCode} to Firebase`);
        } catch (fbError) {
          console.error('Firebase save error:', fbError.message);
        }
      }
      
      return res.status(200).json({ success: true, data: { details, price } });
      
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action! Available: test, companies, details, price, all',
        example: {
          test: '/api/scrape?action=test',
          companies: '/api/scrape?action=companies',
          details: '/api/scrape?action=details&tradingCode=BATASHUR',
          price: '/api/scrape?action=price&tradingCode=BATASHUR',
          all: '/api/scrape?action=all&tradingCode=BATASHUR'
        }
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};