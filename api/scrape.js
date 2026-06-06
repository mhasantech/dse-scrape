const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// ============= FIREBASE CONFIGURATION =============
const serviceAccount = {
  "type": "service_account",
  "project_id": "dse-scraper-c651b",
  "private_key_id": "5c90f5654231207278a93cc9eaeac72e5194709e",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCbu0Vlln8RNCAa\nN8eWs0P/Wk/k+mJpTLCJKhnN2a6rqXW8cGA+TE2s9G0q/I1KFHzALZlagfecj/BR\nEgOs0y9R1q7AtKkuaaja3p2Wa+nf+bDWCuFAHsaAyhIjKx1sCx1MH5/LeOf4Yreb\nMOCOH3sA7rvrleyA5i4xeeig8PJ1yDHmGrlbqZqrWsjmib37B7lhqsBGPxKSfj9j\ngpHWqv4A1fJvtsoKaCt0WyyC7wGmH5XHDnVWqc7egyAcE/Vm/p3N+TsQpRsRechS\nr5vHLHS5UJPFm2smHGQ6BQrUl9D6GoXLHEb5ctnqux7sm1rl0b953nBOlKK3Db4j\n1rFBViB/AgMBAAECggEAFQGFstZB/YgSbHbprSIxIdiEvlYnwBxgE6BiKqoaLX2G\nLAzcborMT3AI6at3Q27QBPwhm1u8kpm3yLetVzqFP3y9xbCYwXHvHNa6WvfjbBq6\nB6UgDQ4ZqHWZTLUcGt7E7Oe3HjMI1zA5o+1L3N/SL6YEIxrt89UYlgPjpRHbIpfQ\nhX5D60xYWp6b7lbb1My8G9fE8Jd+FMPIJDcboGzwupj0wB5BOmXV0MyIp3ytuAUK\npKF6VlddD3pS10BXNC2wg82V2hxqoVMg+/AoQq5ZQ2F7crxe35WiIZWz4bHxuqrO\nI6V0fCjQtd8vU+whQTtaJLPVoXWmhMt75gELrwA3QQKBgQDIvR7VvY59Ajc9NCLl\nh80TOqSS2PO1+HaebVM1R/UVkcYEwYSTCoDvhqnN6WBDwDiS/q8TuVVMvtMqvZ4K\n5YGAK685kf1jVLCM7CCthOtr+P2sV5VD5ZH6nOI1L9/I9x4ECQSxPGjP2EBviaiu\nXA2K1kshNLRuR60dIU4d838f9QKBgQDGmk7Jn/OgH43tFqLJSQxJspyC531xGO7t\n4Kk6DTAy0IxbOzLe8cxajI2mTWn8i7OAiIr3SAZV6FXFIpi2P40ycP9b20JWuzqv\nfxUuHmKDQcAOdef9NFz0aMhSw9OAWUT/XtTb45NH95up99B3yvcTggqNu0H40vB6\ngkZEiJJ6IwKBgFFza2+O2qIepAtRfFdmIvAKe3yaS0kq5/agpYKZD/kQjSig3QpM\n2MRX/85tQ4I6HLqIXMHEEbhyNXzCM754IXPARfk2I3qKgpirtxaxOFU3Urb7UrWa\nEQF/ZsnuAv+oRaWdgynnOSAcvwiC8s7MyzHqgdGXcR7ONo/7U5cTliGBAoGBAIzT\nSEDSKceF+HaAkYeXQ55Sh4aPLTTwECQfJQAj7+RoWs4qKQVLgbNHbP3acOgCC5N9\nvsRfjxaFe6Qgxxab87wrwfbZf63Ob2uX+mXMZ+BY1B2s34Z9BdjNIBcIAsZFBpbq\nIJeXRI1Id1nLfkgjZJWxpVggy0PsF1dXXwojqXHvAoGBAJZP9AKWJBaKkRFK9G8k\npyYa4p/eh/pFgpKJpQr+9ccdihIl3y4T1vJ9OTvLAPlLhYz7IfMY1ZhtPNJZuVj4\nO0IIvDMm8sWciDsVDkwFmE+FuICgYvU/PlWZhpAFQt2QZ9G38mDK446+OfvhyTJa\nGWEUjP4Ti9rjvvC5m/L3WS+t\n-----END PRIVATE KEY-----\n",
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

// ============= UTILITY FUNCTIONS =============

// মার্কেট খোলা আছে কিনা চেক করা
function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // শুক্রবার(5) বা শনিবার(6) বন্ধ
  if (day === 5 || day === 6) return false;
  
  const timeNow = hour * 60 + minute;
  const marketStart = 10 * 60 + 30; // 10:30 AM
  const marketEnd = 14 * 60 + 30;   // 2:30 PM
  
  return timeNow >= marketStart && timeNow <= marketEnd;
}

// শুধু তারিখ বের করার ফাংশন (Record Date এর জন্য)
function extractDateOnly(text) {
  if (!text) return 'N/A';
  // বিভিন্ন ডেট ফরম্যাট চেক করা
  const datePatterns = [
    /\d{2}-\w{3}-\d{4}/,      // 15-May-2024
    /\d{4}-\d{2}-\d{2}/,      // 2024-05-15
    /\d{2}\/\d{2}\/\d{4}/,    // 15/05/2024
    /\d{2}-\d{2}-\d{4}/       // 15-05-2024
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  // যদি কোন তারিখ না পাওয়া যায়
  return text.split('.')[0].split(',')[0].substring(0, 20);
}

// ডিভিডেন্ড থেকে শুধু পার্সেন্ট বের করা
function extractDividendPercent(text) {
  if (!text) return 'N/A';
  const match = text.match(/(\d+(?:\.\d+)?)%/);
  return match ? match[1] + '%' : text;
}

// ============= SCRAPING FUNCTIONS =============

// সব কোম্পানির তালিকা
async function getAllCompanies() {
  try {
    const response = await axios.get('https://www.dsebd.org/stock_price_yesterday.php', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
    
    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

// শুধু প্রয়োজনীয় তথ্য আনার ফাংশন
async function getRequiredStockData(tradingCode) {
  try {
    const url = `https://www.dsebd.org/displayCompany.php?name=${tradingCode}`;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    const html = $.html();
    
    // প্রয়োজনীয় তথ্য সংগ্রহ
    const stockData = {
      tradingCode: tradingCode,
      shareCategory: 'N/A',
      listingYear: 'N/A',
      recordDate: 'N/A',
      cashDividend: 'N/A',
      stockDividend: 'N/A',
      scrapedAt: new Date().toISOString()
    };
    
    // Share Category
    const catMatch = html.match(/Share Category\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (catMatch) stockData.shareCategory = catMatch[1].trim();
    
    // Listing Year
    const yearMatch = html.match(/Listing Year\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (yearMatch) stockData.listingYear = yearMatch[1].trim();
    
    // Record Date (শুধু তারিখ)
    const recordMatch = html.match(/Record Date\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (recordMatch) stockData.recordDate = extractDateOnly(recordMatch[1]);
    
    // Cash Dividend (শুধু latest টা)
    const cashMatch = html.match(/Cash Dividend\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (cashMatch) {
      const cashText = cashMatch[1];
      // লেটেস্ট ডিভিডেন্ড বের করা (সাধারণত প্রথমটা)
      const latestCash = cashText.split(',')[0];
      stockData.cashDividend = extractDividendPercent(latestCash);
    }
    
    // Stock Dividend (শুধু latest টা)
    const stockMatch = html.match(/Stock Dividend\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (stockMatch) {
      const stockText = stockMatch[1];
      const latestStock = stockText.split(',')[0];
      stockData.stockDividend = extractDividendPercent(latestStock);
    }
    
    return stockData;
  } catch (error) {
    console.error(`Error fetching data for ${tradingCode}:`, error.message);
    return { 
      tradingCode: tradingCode, 
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  }
}

// মার্কেট প্রাইস (LTP, High, Low)
async function getMarketPrice(tradingCode) {
  try {
    const response = await axios.get('https://www.dsebd.org/latest_share_price_scroll_l.php', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    let priceData = {
      tradingCode: tradingCode,
      ltp: 'N/A',
      high: 'N/A',
      low: 'N/A',
      marketOpen: isMarketOpen(),
      scrapedAt: new Date().toISOString()
    };
    
    $('tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 6) {
        const code = $(tds[0]).text().trim();
        if (code.toUpperCase() === tradingCode.toUpperCase()) {
          priceData = {
            tradingCode: tradingCode,
            ltp: $(tds[1]).text().trim() || 'N/A',
            high: $(tds[4]).text().trim() || 'N/A',
            low: $(tds[5]).text().trim() || 'N/A',
            marketOpen: isMarketOpen(),
            scrapedAt: new Date().toISOString()
          };
          return false;
        }
      }
    });
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${tradingCode}:`, error.message);
    return { 
      tradingCode: tradingCode, 
      ltp: 'Error',
      high: 'N/A',
      low: 'N/A',
      marketOpen: isMarketOpen(),
      scrapedAt: new Date().toISOString()
    };
  }
}

// Firebase এ সেভ
async function saveToFirebase(tradingCode, stockData, priceData) {
  try {
    if (stockData && !stockData.error) {
      await db.collection('stock_info').doc(tradingCode).set(stockData, { merge: true });
    }
    if (priceData && priceData.ltp && priceData.ltp !== 'N/A' && priceData.ltp !== 'Error') {
      await db.collection('stock_prices').doc(tradingCode).set(priceData, { merge: true });
    }
    return true;
  } catch (error) {
    console.error('Firebase save error:', error.message);
    return false;
  }
}

// ============= API HANDLER =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, tradingCode, codes } = req.query;
    const marketOpen = isMarketOpen();
    
    // হেল্প / ডকুমেন্টেশন
    if (action === 'help' || !action) {
      return res.status(200).json({
        success: true,
        message: 'DSE Stock Scraper - Required Fields Only',
        marketOpen: marketOpen,
        fields: ['Share Category', 'Listing Year', 'Record Date', 'Cash Dividend', 'Stock Dividend', 'LTP', 'High', 'Low'],
        endpoints: {
          test: '?action=test',
          status: '?action=market-status',
          companies: '?action=companies',
          stock: '?action=stock&tradingCode=GP',
          price: '?action=price&tradingCode=GP',
          all: '?action=all&tradingCode=GP',
          batch: '?action=batch&codes=GP,SQUARE,BATASHUR'
        }
      });
    }
    
    // টেস্ট
    if (action === 'test') {
      return res.status(200).json({
        success: true,
        message: 'DSE Scraper API is working!',
        marketOpen: marketOpen,
        timestamp: new Date().toISOString()
      });
    }
    
    // মার্কেট স্ট্যাটাস
    if (action === 'market-status') {
      return res.status(200).json({
        success: true,
        marketOpen: marketOpen,
        currentTime: new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
        message: marketOpen ? 'Market is OPEN' : 'Market is CLOSED'
      });
    }
    
    // সব কোম্পানি
    if (action === 'companies') {
      const companies = await getAllCompanies();
      return res.status(200).json({
        success: true,
        count: companies.length,
        marketOpen: marketOpen,
        data: companies
      });
    }
    
    // শুধু স্টক তথ্য (Share Category, Listing Year, Record Date, Dividends)
    if (action === 'stock' && tradingCode) {
      const stockData = await getRequiredStockData(tradingCode.toUpperCase());
      return res.status(200).json({ success: true, marketOpen: marketOpen, data: stockData });
    }
    
    // শুধু প্রাইস (LTP, High, Low)
    if (action === 'price' && tradingCode) {
      const priceData = await getMarketPrice(tradingCode.toUpperCase());
      return res.status(200).json({ success: true, marketOpen: marketOpen, data: priceData });
    }
    
    // সব তথ্য একসাথে (শুধু প্রয়োজনীয় ফিল্ড)
    if (action === 'all' && tradingCode) {
      const code = tradingCode.toUpperCase();
      const [stockData, priceData] = await Promise.all([
        getRequiredStockData(code),
        getMarketPrice(code)
      ]);
      
      await saveToFirebase(code, stockData, priceData);
      
      // শুধু প্রয়োজনীয় ফিল্ডগুলো রিটার্ন করছি
      const result = {
        tradingCode: code,
        shareCategory: stockData.shareCategory,
        listingYear: stockData.listingYear,
        recordDate: stockData.recordDate,
        cashDividend: stockData.cashDividend,
        stockDividend: stockData.stockDividend,
        ltp: priceData.ltp,
        high: priceData.high,
        low: priceData.low,
        marketOpen: marketOpen,
        lastUpdated: new Date().toISOString()
      };
      
      return res.status(200).json({ success: true, data: result });
    }
    
    // ব্যাচ প্রসেসিং (একাধিক কোম্পানি)
    if (action === 'batch' && codes) {
      const codeList = codes.split(',').map(c => c.trim().toUpperCase()).slice(0, 10);
      const results = [];
      
      for (const code of codeList) {
        const [stockData, priceData] = await Promise.all([
          getRequiredStockData(code),
          getMarketPrice(code)
        ]);
        
        await saveToFirebase(code, stockData, priceData);
        
        results.push({
          tradingCode: code,
          shareCategory: stockData.shareCategory,
          listingYear: stockData.listingYear,
          recordDate: stockData.recordDate,
          cashDividend: stockData.cashDividend,
          stockDividend: stockData.stockDividend,
          ltp: priceData.ltp,
          high: priceData.high,
          low: priceData.low
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return res.status(200).json({
        success: true,
        marketOpen: marketOpen,
        count: results.length,
        data: results
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid action',
      availableActions: ['test', 'market-status', 'companies', 'stock', 'price', 'all', 'batch'],
      example: '?action=all&tradingCode=GP'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};