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
  const marketStart = 10 * 60 + 30;
  const marketEnd = 14 * 60 + 30;
  
  return timeNow >= marketStart && timeNow <= marketEnd;
}

// ক্লিন টেক্সট ফাংশন
function cleanText(text) {
  if (!text) return 'N/A';
  return text.replace(/\s+/g, ' ').trim();
}

// এক্সট্রাক্ট ভ্যালু ফাংশন
function extractValue($row, selectors) {
  for (const selector of selectors) {
    const val = $(row).find(selector).last().text().trim();
    if (val && val !== '-' && val !== 'N/A') return cleanText(val);
  }
  return 'N/A';
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

// কোম্পানির বিস্তারিত তথ্য
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
    
    // তথ্য সংগ্রহ
    $('table tr, .table tr').each((i, row) => {
      const text = $(row).text().toLowerCase();
      const th = $(row).find('th').text().toLowerCase();
      const td = $(row).find('td');
      
      // কোম্পানির নাম
      if (text.includes('company name') || th.includes('company name')) {
        details.companyName = extractValue($(row), ['td:last-child', '.value', '.info']);
      }
      
      // ট্রেডিং কোড
      if (text.includes('trading code') || th.includes('trading code')) {
        const val = extractValue($(row), ['td:last-child', '.value']);
        if (val !== tradingCode) details.scripCode = val;
      }
      
      // লিস্টিং ইয়ার
      if (text.includes('listing year') || th.includes('listing year')) {
        details.listingYear = extractValue($(row), ['td:last-child', '.value']);
      }
      
      // শেয়ার ক্যাটাগরি
      if (text.includes('share category') || th.includes('share category')) {
        details.shareCategory = extractValue($(row), ['td:last-child', '.value']);
      }
      
      // ফেস ভ্যালু
      if (text.includes('face value') || th.includes('face value')) {
        details.faceValue = extractValue($(row), ['td:last-child', '.value']);
      }
      
      // পেইড আপ ক্যাপিটাল
      if ((text.includes('paid up capital') || th.includes('paid up capital')) && !text.includes('type')) {
        const val = extractValue($(row), ['td:last-child', '.value']);
        if (val && !val.includes('Equity') && !val.includes('Type')) {
          details.paidUpCapital = val;
        }
      }
      
      // ইপিএস
      if (text.includes('eps') || th.includes('eps')) {
        const val = extractValue($(row), ['td:last-child', '.value']);
        if (val && !val.includes('Using') && !val.includes('Diluted')) {
          details.eps = val;
        }
      }
      
      // এনএভি
      if ((text.includes('nav') || th.includes('nav')) && !text.includes('per share')) {
        const val = extractValue($(row), ['td:last-child', '.value']);
        if (val && !val.includes('Profit') && !val.includes('Loss')) {
          details.nav = val;
        }
      }
      
      // পি/ই রেশিও
      if (text.includes('p/e') || th.includes('p/e')) {
        const val = extractValue($(row), ['td:last-child', '.value']);
        if (val && !val.includes('Dividend Yield')) {
          details.peRatio = val;
        }
      }
      
      // ডিভিডেন্ড
      if (text.includes('dividend') && !text.includes('cash') && !text.includes('stock')) {
        details.dividend = extractValue($(row), ['td:last-child', '.value']);
      }
      
      // ক্যাশ ডিভিডেন্ড
      if (text.includes('cash dividend') || (text.includes('dividend') && text.includes('cash'))) {
        details.cashDividend = extractValue($(row), ['td:last-child', '.value']);
      }
      
      // স্টক ডিভিডেন্ড / বোনাস
      if (text.includes('stock dividend') || text.includes('bonus')) {
        details.stockDividend = extractValue($(row), ['td:last-child', '.value']);
      }
      
      // রেকর্ড ডেট (শুধু তারিখ বের করা)
      if (text.includes('record date') || text.includes('booking date')) {
        let val = extractValue($(row), ['td:last-child', '.value']);
        const dateMatch = val.match(/\d{2}[-/]\w{3}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2}/);
        details.recordDate = dateMatch ? dateMatch[0] : val.split('.')[0].substring(0, 30);
      }
    });
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error.message);
    return { tradingCode, error: error.message, scrapedAt: new Date().toISOString() };
  }
}

// মার্কেট প্রাইস
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
    
    $('table tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 6) {
        const firstCol = $(tds[0]).text().trim();
        if (firstCol.toUpperCase() === tradingCode.toUpperCase()) {
          const ltp = $(tds[1]).text().trim();
          const ycp = $(tds[3]).text().trim();
          let changePercent = 'N/A';
          
          if (ltp !== 'N/A' && ycp !== 'N/A' && ltp && ycp) {
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
            volume: $(tds[6]) ? $(tds[6]).text().trim() : 'N/A',
            value: $(tds[7]) ? $(tds[7]).text().trim() : 'N/A',
            trade: $(tds[8]) ? $(tds[8]).text().trim() : 'N/A',
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
    if (details && Object.keys(details).length > 1) {
      await db.collection('company_details').doc(tradingCode).set(details, { merge: true });
    }
    
    if (price && price.ltp && price.ltp !== 'N/A' && price.ltp !== 'Error') {
      await db.collection('market_prices').doc(tradingCode).set(price, { merge: true });
      
      // হিস্টোরি সেভ
      const historyRef = db.collection('price_history').doc(tradingCode).collection('daily');
      await historyRef.add({
        ltp: price.ltp,
        high: price.high,
        low: price.low,
        volume: price.volume,
        change: price.change,
        changePercent: price.changePercent,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Firebase save error:`, error.message);
    return false;
  }
}

// ============= API HANDLER =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
        message: 'DSE Stock Scraper API',
        marketOpen: marketOpen,
        endpoints: {
          'Test': '?action=test',
          'Market Status': '?action=market-status',
          'All Companies': '?action=companies',
          'Search': '?action=search&query=GP',
          'Details': '?action=details&tradingCode=GP',
          'Price': '?action=price&tradingCode=GP',
          'Complete': '?action=all&tradingCode=GP',
          'Batch': '?action=batch&codes=GP,SQUARE,BATASHUR'
        },
        sampleCodes: ['GP', 'BATASHUR', 'SQUARE', 'UTTARABANK', 'BRACBANK']
      });
    }
    
    // টেস্ট
    if (action === 'test') {
      return res.status(200).json({
        success: true,
        message: 'DSE Scraper API is running!',
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
        marketHours: 'Sunday-Thursday, 10:30 AM - 2:30 PM'
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
    
    // সার্চ
    if (action === 'search' && tradingCode) {
      const companies = await getAllCompanies();
      const searchTerm = tradingCode.toUpperCase();
      const filtered = companies.filter(c => 
        c.code.includes(searchTerm) || c.name.toUpperCase().includes(searchTerm)
      );
      return res.status(200).json({
        success: true,
        searchTerm: searchTerm,
        count: filtered.length,
        marketOpen: marketOpen,
        data: filtered.slice(0, 20)
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
    
    // সব ডাটা
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
    
    // ব্যাচ প্রসেসিং
    if (action === 'batch' && codes) {
      const codeList = codes.split(',').map(c => c.trim().toUpperCase()).slice(0, 10);
      const results = [];
      
      for (const code of codeList) {
        const [details, price] = await Promise.all([
          getCompanyDetails(code),
          getMarketPrice(code)
        ]);
        await saveToFirebase(code, details, price);
        results.push({ code, details, price });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return res.status(200).json({
        success: true,
        marketOpen: marketOpen,
        processed: results.length,
        data: results
      });
    }
    
    // Invalid action
    return res.status(400).json({
      success: false,
      message: `Invalid action: ${action}`,
      availableActions: ['test', 'help', 'market-status', 'companies', 'search', 'details', 'price', 'all', 'batch']
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};