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

// ============= SIMPLE SCRAPING FUNCTIONS =============

// মার্কেট খোলা আছে কিনা চেক করা
function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  if (day === 5 || day === 6) return false;
  
  const timeNow = hour * 60 + minute;
  const marketStart = 10 * 60 + 30;
  const marketEnd = 14 * 60 + 30;
  
  return timeNow >= marketStart && timeNow <= marketEnd;
}

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

// কোম্পানির বিস্তারিত তথ্য (সরলীকৃত)
async function getCompanyDetails(tradingCode) {
  try {
    const url = `https://www.dsebd.org/displayCompany.php?name=${tradingCode}`;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    const details = {
      tradingCode: tradingCode,
      scrapedAt: new Date().toISOString()
    };
    
    // টেক্সট সার্চ করে ডাটা নেওয়া
    const html = $.html();
    
    // কোম্পানির নাম
    const nameMatch = html.match(/Company Name\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (nameMatch) details.companyName = nameMatch[1].trim();
    
    // ট্রেডিং কোড
    const codeMatch = html.match(/Trading Code\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (codeMatch && codeMatch[1].trim() !== tradingCode) details.scripCode = codeMatch[1].trim();
    
    // লিস্টিং ইয়ার
    const yearMatch = html.match(/Listing Year\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (yearMatch) details.listingYear = yearMatch[1].trim();
    
    // শেয়ার ক্যাটাগরি
    const catMatch = html.match(/Share Category\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (catMatch) details.shareCategory = catMatch[1].trim();
    
    // ফেস ভ্যালু
    const faceMatch = html.match(/Face Value\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (faceMatch) details.faceValue = faceMatch[1].trim();
    
    // ইপিএস
    const epsMatch = html.match(/EPS\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (epsMatch) details.eps = epsMatch[1].trim();
    
    // এনএভি
    const navMatch = html.match(/NAV\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (navMatch) details.nav = navMatch[1].trim();
    
    // পি/ই রেশিও
    const peMatch = html.match(/P\/E Ratio\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (peMatch) details.peRatio = peMatch[1].trim();
    
    // ডিভিডেন্ড
    const divMatch = html.match(/Dividend\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (divMatch) details.dividend = divMatch[1].trim();
    
    // ক্যাশ ডিভিডেন্ড
    const cashMatch = html.match(/Cash Dividend\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (cashMatch) details.cashDividend = cashMatch[1].trim();
    
    // স্টক ডিভিডেন্ড
    const stockMatch = html.match(/Stock Dividend\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (stockMatch) details.stockDividend = stockMatch[1].trim();
    
    // রেকর্ড ডেট
    const recordMatch = html.match(/Record Date\s*<\/th>\s*<td[^>]*>([^<]+)</i);
    if (recordMatch) details.recordDate = recordMatch[1].trim();
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error.message);
    return { tradingCode, error: error.message, scrapedAt: new Date().toISOString() };
  }
}

// মার্কেট প্রাইস (সরলীকৃত)
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
      ycp: 'N/A',
      change: 'N/A',
      changePercent: 'N/A',
      volume: 'N/A',
      value: 'N/A',
      trade: 'N/A',
      scrapedAt: new Date().toISOString(),
      marketOpen: isMarketOpen()
    };
    
    // টেবিল থেকে ডাটা খোঁজা
    $('tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 6) {
        const code = $(tds[0]).text().trim();
        if (code.toUpperCase() === tradingCode.toUpperCase()) {
          const ltp = $(tds[1]).text().trim();
          const ycp = $(tds[3]).text().trim();
          let changePercent = 'N/A';
          
          if (ltp && ycp && ltp !== 'N/A' && ycp !== 'N/A') {
            const ltpNum = parseFloat(ltp);
            const ycpNum = parseFloat(ycp);
            if (!isNaN(ltpNum) && !isNaN(ycpNum) && ycpNum !== 0) {
              changePercent = (((ltpNum - ycpNum) / ycpNum) * 100).toFixed(2) + '%';
            }
          }
          
          priceData = {
            tradingCode: tradingCode,
            ltp: ltp || 'N/A',
            change: $(tds[2]).text().trim() || 'N/A',
            ycp: ycp || 'N/A',
            high: $(tds[4]).text().trim() || 'N/A',
            low: $(tds[5]).text().trim() || 'N/A',
            volume: tds[6] ? $(tds[6]).text().trim() : 'N/A',
            value: tds[7] ? $(tds[7]).text().trim() : 'N/A',
            trade: tds[8] ? $(tds[8]).text().trim() : 'N/A',
            changePercent: changePercent,
            scrapedAt: new Date().toISOString(),
            marketOpen: isMarketOpen()
          };
          return false;
        }
      }
    });
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${tradingCode}:`, error.message);
    return { tradingCode, ltp: 'Error', marketOpen: isMarketOpen(), scrapedAt: new Date().toISOString() };
  }
}

// Firebase এ সেভ
async function saveToFirebase(tradingCode, details, price) {
  try {
    if (details && !details.error) {
      await db.collection('company_details').doc(tradingCode).set(details, { merge: true });
    }
    if (price && price.ltp && price.ltp !== 'N/A' && price.ltp !== 'Error') {
      await db.collection('market_prices').doc(tradingCode).set(price, { merge: true });
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
    const { action, tradingCode } = req.query;
    const marketOpen = isMarketOpen();
    
    // হেল্প
    if (action === 'help' || !action) {
      return res.status(200).json({
        success: true,
        message: 'DSE Stock Scraper API',
        marketOpen: marketOpen,
        endpoints: {
          test: '?action=test',
          status: '?action=market-status',
          companies: '?action=companies',
          details: '?action=details&tradingCode=GP',
          price: '?action=price&tradingCode=GP',
          all: '?action=all&tradingCode=GP'
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
        currentTime: new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })
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
    
    // শুধু ডিটেইলস
    if (action === 'details' && tradingCode) {
      const details = await getCompanyDetails(tradingCode.toUpperCase());
      return res.status(200).json({ success: true, marketOpen: marketOpen, data: details });
    }
    
    // শুধু প্রাইস
    if (action === 'price' && tradingCode) {
      const price = await getMarketPrice(tradingCode.toUpperCase());
      return res.status(200).json({ success: true, marketOpen: marketOpen, data: price });
    }
    
    // সব ডাটা একসাথে
    if (action === 'all' && tradingCode) {
      const code = tradingCode.toUpperCase();
      const [details, price] = await Promise.all([
        getCompanyDetails(code),
        getMarketPrice(code)
      ]);
      
      await saveToFirebase(code, details, price);
      
      return res.status(200).json({
        success: true,
        marketOpen: marketOpen,
        data: { details, price, lastUpdated: new Date().toISOString() }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use: test, market-status, companies, details, price, all',
      example: '?action=all&tradingCode=GP'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};