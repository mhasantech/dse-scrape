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

// ============= HELPER FUNCTIONS =============

// মার্কেট খোলা আছে কিনা চেক করা
function isMarketOpen() {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // শুক্রবার(5) বা শনিবার(6) বন্ধ
  if (day === 5 || day === 6) return false;
  
  // সকাল ১০:৩০ থেকে বিকাল ২:৩০ পর্যন্ত
  const timeNow = hour * 60 + minute;
  const marketStart = 10 * 60 + 30; // 10:30 AM
  const marketEnd = 14 * 60 + 30;   // 2:30 PM
  
  return timeNow >= marketStart && timeNow <= marketEnd;
}

// সব কোম্পানির তালিকা
async function getAllCompanies() {
  try {
    console.log('📊 Fetching companies from DSE...');
    const response = await axios.get('https://www.dsebd.org/stock_price_yesterday.php', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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
    
    console.log(`✅ Found ${companies.length} companies`);
    return companies.slice(0, 100);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}
// ============= রেকর্ড ডেট স্ক্র্যাপার (DSE AGM & Record Date Page) =============
async function getRecordDates() {
  try {
    console.log('📅 Fetching record dates from DSE...');
    const response = await axios.get('https://www.dsebd.org/CompAGM&RecordDate.php', {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    const $ = cheerio.load(response.data);
    const recordDates = [];
    
    // ডিবাগ: HTML এর টেবিল অংশ দেখা
    console.log('HTML length:', response.data.length);
    
    // একাধিক টেবিল সিলেক্টর চেষ্টা করা
    let tables = $('table');
    console.log('Tables found:', tables.length);
    
    if (tables.length === 0) {
      console.log('No tables found, trying alternative selectors...');
      tables = $('.table, .dataTable, #recordTable');
    }
    
    // প্রতিটি টেবিল চেক করা
    tables.each((tableIdx, table) => {
      $(table).find('tr').each((i, row) => {
        const tds = $(row).find('td');
        const ths = $(row).find('th');
        
        // যদি হেডার রো হয়, স্কিপ করুন
        const headerText = $(row).text().toLowerCase();
        if (headerText.includes('company') || headerText.includes('sl no') || headerText.includes('serial')) {
          return;
        }
        
        if (tds.length >= 3) {
          // ক্লিন টেক্সট ফাংশন
          const cleanText = (text) => {
            return text.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          };
          
          let companyName = cleanText($(tds[0]).text());
          let agmDate = cleanText($(tds[1]).text());
          let recordDate = cleanText($(tds[2]).text());
          
          // যদি প্রথম কলামে নাম্বার থাকে, তাহলে দ্বিতীয় কলামে নাম থাকতে পারে
          if (companyName.match(/^\d+$/) && tds.length >= 4) {
            companyName = cleanText($(tds[1]).text());
            agmDate = cleanText($(tds[2]).text());
            recordDate = cleanText($(tds[3]).text());
          }
          
          // শুধু ভালো ডাটা নেওয়া (যেখানে কোম্পানির নাম আছে এবং খুব ছোট না)
          if (companyName && companyName.length > 2 && companyName !== 'N/A' && !companyName.match(/^\d+$/)) {
            // রেকর্ড ডেট থেকে শুধু তারিখ বের করা
            const cleanRecordDate = extractDateOnly(recordDate);
            const cleanAgmDate = extractDateOnly(agmDate);
            
            recordDates.push({
              company: companyName,
              agmDate: cleanAgmDate !== 'N/A' ? cleanAgmDate : agmDate,
              recordDate: cleanRecordDate,
              scrapedAt: new Date().toISOString()
            });
          }
        }
      });
    });
    
    // ডুপ্লিকেট রিমুভ করা (কোম্পানির নাম অনুসারে)
    const uniqueRecords = [];
    const companyNames = new Set();
    
    for (const record of recordDates) {
      if (!companyNames.has(record.company)) {
        companyNames.add(record.company);
        uniqueRecords.push(record);
      }
    }
    
    console.log(`✅ Found ${uniqueRecords.length} unique record dates`);
    return uniqueRecords;
    
  } catch (error) {
    console.error('Error fetching record dates:', error.message);
    return [];
  }
}

// উন্নত তারিখ এক্সট্রাক্ট ফাংশন
function extractDateOnly(text) {
  if (!text || text === 'N/A' || text === '') return 'N/A';
  
  // ক্লিন টেক্সট
  let cleanText = text.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // বিভিন্ন ডেট ফরম্যাট
  const datePatterns = [
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,     // 15-05-2024 or 15/05/2024
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,     // 2024-05-15
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, // 15 May 2024
    /(\d{1,2})[-/](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/](\d{4})/i // 15-May-2024
  ];
  
  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      // ফরম্যাট করা তারিখ রিটার্ন
      if (match[2] && match[2].match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
      return match[0];
    }
  }
  
  // যদি কোনো তারিখ না পাওয়া যায়, কিন্তু টেক্সটে তারিখের ইঙ্গিত থাকে
  if (cleanText.includes('Pending') || cleanText.includes('TBA')) {
    return 'Pending';
  }
  
  return cleanText.substring(0, 30);
}
// কোম্পানির বিস্তারিত তথ্য (EPS, Share Category, Dividend, Record Date সহ)
async function getCompanyDetails(tradingCode) {
  try {
    const url = `https://www.dsebd.org/displayCompany.php?name=${tradingCode}`;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const $ = cheerio.load(response.data);
    const details = { 
      tradingCode: tradingCode,
      scrapedAt: new Date().toISOString()
    };
    
    // সব টেবিল এবং ডিভ থেকে তথ্য সংগ্রহ
    $('table, .table, .companyInfo, .detailsTable').find('tr, .row, .info-row').each((i, row) => {
      const text = $(row).text().toLowerCase();
      const html = $(row).html() || '';
      
      // কোম্পানির নাম
      if (text.includes('company name') || text.includes('name of company')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.companyName = value;
      }
      
      // ট্রেডিং কোড
      if (text.includes('trading code') || text.includes('scrip code')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value && value !== tradingCode) details.scripCode = value;
      }
      
      // ইপিএস (EPS)
      if (text.includes('eps') || text.includes('earning per share')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.eps = value.replace(/[^0-9.-]/g, '');
      }
      
      // শেয়ার ক্যাটাগরি
      if (text.includes('share category') || text.includes('category')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.shareCategory = value;
      }
      
      // ফেস ভ্যালু
      if (text.includes('face value')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.faceValue = value;
      }
      
      // NAV (নেট অ্যাসেট ভ্যালু)
      if (text.includes('nav') || text.includes('net asset value')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.nav = value;
      }
      
      // পি/ই রেশিও
      if (text.includes('p/e') || text.includes('pe ratio')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.peRatio = value;
      }
      
      // ডিভিডেন্ড
      if (text.includes('dividend')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.dividend = value;
      }
      
      // ক্যাশ ডিভিডেন্ড
      if (text.includes('cash dividend')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.cashDividend = value;
      }
      
      // স্টক ডিভিডেন্ড / বোনাস
      if (text.includes('stock dividend') || text.includes('bonus')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.stockDividend = value;
      }
      
      // আপনার existing getCompanyDetails ফাংশনে recordDate অংশটি আপডেট করুন
if (text.includes('record date') || text.includes('booking date') || text.includes('date of record')) {
  let value = $(row).find('td, .value, .info').last().text().trim();
  if (value && value !== '-') {
    // নোট বাদ দেওয়া
    let cleanValue = value.split('Note:')[0].split('Disclaimer:')[0].trim();
    
    // তারিখ খোঁজা
    const dateMatch = cleanValue.match(/\d{1,2}[-/]\w{3}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2}/);
    if (dateMatch) {
      details.recordDate = dateMatch[0];
    } else if (cleanValue.length < 50) {
      details.recordDate = cleanValue;
    } else {
      details.recordDate = 'N/A';
    }
  }
}
      
      // লিস্টিং ইয়ার
      if (text.includes('listing year') || text.includes('listed year')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.listingYear = value;
      }
      
      // পেইড-আপ ক্যাপিটাল
      if (text.includes('paid up capital') || text.includes('paid-up capital')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.paidUpCapital = value;
      }
      
      // অথরাইজড ক্যাপিটাল
      if (text.includes('authorized capital')) {
        const value = $(row).find('td, .value, .info').last().text().trim();
        if (value) details.authorizedCapital = value;
      }
    });
    
    // পুরো HTML থেকে ডাটা এক্সট্রাক্ট (Regex ব্যবহার করে)
    const htmlText = $.html();
    
    // EPS খোঁজা (বিভিন্ন ফরম্যাটে)
    const epsMatch = htmlText.match(/EPS[:\s]*([0-9.]+)/i) || 
                     htmlText.match(/Earning Per Share[:\s]*([0-9.]+)/i);
    if (epsMatch && !details.eps) details.eps = epsMatch[1];
    
    // ডিভিডেন্ড খোঁজা
    const divMatch = htmlText.match(/Dividend[:\s]*([0-9.]+%?)/i) ||
                     htmlText.match(/Dividend[:\s]*([0-9.]+)\s*%/i);
    if (divMatch && !details.dividend) details.dividend = divMatch[1];
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error.message);
    return { 
      tradingCode: tradingCode, 
      error: error.message, 
      scrapedAt: new Date().toISOString() 
    };
  }
}

// মার্কেট প্রাইস (LTP, High, Low, Volume, Change)
async function getMarketPrice(tradingCode) {
  try {
    const response = await axios.get('https://www.dsebd.org/latest_share_price_scroll_l.php', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
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
    
    // সব টেবিল রো চেক করা
    $('table tr, .table tr, .tblData tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 6) {
        const firstCol = $(tds[0]).text().trim();
        if (firstCol.toUpperCase() === tradingCode.toUpperCase()) {
          priceData = {
            tradingCode: tradingCode,
            ltp: $(tds[1]).text().trim() || 'N/A',
            change: $(tds[2]).text().trim() || 'N/A',
            ycp: $(tds[3]).text().trim() || 'N/A',
            high: $(tds[4]).text().trim() || 'N/A',
            low: $(tds[5]).text().trim() || 'N/A',
            volume: $(tds[6]) ? $(tds[6]).text().trim() : 'N/A',
            value: $(tds[7]) ? $(tds[7]).text().trim() : 'N/A',
            trade: $(tds[8]) ? $(tds[8]).text().trim() : 'N/A',
            changePercent: calculateChangePercent($(tds[1]).text().trim(), $(tds[3]).text().trim()),
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
    return { 
      tradingCode: tradingCode, 
      ltp: 'Error', 
      error: error.message,
      marketOpen: isMarketOpen(),
      scrapedAt: new Date().toISOString() 
    };
  }
}

// চেঞ্জ পার্সেন্ট ক্যালকুলেট করা
function calculateChangePercent(ltp, ycp) {
  if (!ltp || !ycp || ltp === 'N/A' || ycp === 'N/A') return 'N/A';
  const ltpNum = parseFloat(ltp);
  const ycpNum = parseFloat(ycp);
  if (isNaN(ltpNum) || isNaN(ycpNum) || ycpNum === 0) return 'N/A';
  const changePercent = ((ltpNum - ycpNum) / ycpNum) * 100;
  return changePercent.toFixed(2) + '%';
}

// ব্যাচ প্রসেসিং (একাধিক কোম্পানি)
async function batchScrape(tradingCodes, maxConcurrent = 3) {
  const results = [];
  const marketOpen = isMarketOpen();
  
  for (let i = 0; i < tradingCodes.length; i += maxConcurrent) {
    const batch = tradingCodes.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (code) => {
      const [details, price] = await Promise.all([
        getCompanyDetails(code),
        getMarketPrice(code)
      ]);
      return { code, details, price, marketOpen };
    });
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting - delay between batches
    if (i + maxConcurrent < tradingCodes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Firebase এ ডাটা সেভ করা
async function saveToFirebase(tradingCode, details, price) {
  try {
    // কোম্পানির ডিটেইলস সেভ
    if (details && Object.keys(details).length > 1) {
      await db.collection('company_details').doc(tradingCode).set(details, { merge: true });
    }
    
    // মার্কেট প্রাইস সেভ
    if (price && price.ltp && price.ltp !== 'N/A' && price.ltp !== 'Error') {
      await db.collection('market_prices').doc(tradingCode).set(price, { merge: true });
      
      // হিস্টোরিক্যাল ডাটা সেভ (প্রতিটি আপডেট আলাদা ডকুমেন্ট হিসেবে)
      const historyRef = db.collection('price_history').doc(tradingCode).collection('history');
      await historyRef.add({
        ltp: price.ltp,
        high: price.high,
        low: price.low,
        volume: price.volume,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`✅ Saved ${tradingCode} to Firebase`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase save error for ${tradingCode}:`, error.message);
    return false;
  }
}

// ============= MAIN API HANDLER =============
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, tradingCode, codes } = req.query;
    const marketStatus = isMarketOpen();
    
    console.log(`📡 API Call: action=${action}, code=${tradingCode}, marketOpen=${marketStatus}`);
    
    // ============= ACTION HANDLERS =============
    
    // 1. টেস্ট এন্ডপয়েন্ট
    if (action === 'test') {
      return res.status(200).json({
        success: true,
        message: 'DSE Scraper API is running!',
        marketOpen: marketStatus,
        timestamp: new Date().toISOString(),
        endpoints: {
          test: '/api/scrape?action=test',
          companies: '/api/scrape?action=companies',
          details: '/api/scrape?action=details&tradingCode=GP',
          price: '/api/scrape?action=price&tradingCode=GP',
          all: '/api/scrape?action=all&tradingCode=GP',
          batch: '/api/scrape?action=batch&codes=GP,SQUARE,BATASHUR',
          search: '/api/scrape?action=search&query=BATA'
        }
      });
    }
    
    // 2. সব কোম্পানির তালিকা
    if (action === 'companies') {
      const companies = await getAllCompanies();
      return res.status(200).json({
        success: true,
        count: companies.length,
        marketOpen: marketStatus,
        data: companies
      });
    }
    
    // 3. কোম্পানির বিস্তারিত তথ্য শুধু
    if (action === 'details' && tradingCode) {
      const details = await getCompanyDetails(tradingCode.toUpperCase());
      return res.status(200).json({
        success: true,
        marketOpen: marketStatus,
        data: details
      });
    }
    
    // 4. মার্কেট প্রাইস শুধু
    if (action === 'price' && tradingCode) {
      const price = await getMarketPrice(tradingCode.toUpperCase());
      return res.status(200).json({
        success: true,
        marketOpen: marketStatus,
        data: price
      });
    }
    
    // 5. সব তথ্য একসাথে (Details + Price)
    if (action === 'all' && tradingCode) {
      const code = tradingCode.toUpperCase();
      const [details, price] = await Promise.all([
        getCompanyDetails(code),
        getMarketPrice(code)
      ]);
      
      // Firebase এ সেভ
      await saveToFirebase(code, details, price);
      
      return res.status(200).json({
        success: true,
        marketOpen: marketStatus,
        data: {
          details: details,
          price: price,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    // 6. ব্যাচ প্রসেসিং (একাধিক কোম্পানি)
    if (action === 'batch' && codes) {
      const codeList = codes.split(',').map(c => c.trim().toUpperCase());
      const results = await batchScrape(codeList);
      
      // সব রেজাল্ট Firebase এ সেভ
      for (const result of results) {
        await saveToFirebase(result.code, result.details, result.price);
      }
      
      return res.status(200).json({
        success: true,
        marketOpen: marketStatus,
        processed: results.length,
        data: results
      });
    }
    
    // 7. সার্চ ফাংশন (কোম্পানি খোঁজা)
    if (action === 'search' && tradingCode) {
      const companies = await getAllCompanies();
      const searchTerm = tradingCode.toUpperCase();
      const filtered = companies.filter(c => 
        c.code.includes(searchTerm) || 
        c.name.toUpperCase().includes(searchTerm)
      );
      return res.status(200).json({
        success: true,
        searchTerm: searchTerm,
        count: filtered.length,
        marketOpen: marketStatus,
        data: filtered.slice(0, 20)
      });
    }
    
    // 8. মার্কেট স্ট্যাটাস চেক
    if (action === 'market-status') {
      return res.status(200).json({
        success: true,
        marketOpen: marketStatus,
        currentTime: new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
        marketHours: {
          start: '10:30 AM',
          end: '2:30 PM',
          days: 'Sunday to Thursday'
        },
        isHoliday: !marketStatus && new Date().getDay() !== 5 && new Date().getDay() !== 6 ? 'Market closed for today' : 'Weekend'
      });
    }
    
    // 9. হট স্টকস (টপ ভলিউম)
    if (action === 'hot-stocks') {
      // কিছু প্রিমিয়াম কোম্পানির তালিকা
      const hotCodes = ['GP', 'BATASHUR', 'SQUARE', 'BRACBANK', 'DUTCHBANGLA', 'ROBI', 'BEXIMCO', 'IFADAUTOS'];
      const results = await batchScrape(hotCodes);
      return res.status(200).json({
        success: true,
        marketOpen: marketStatus,
        data: results
      });
    }
    // 11. রেকর্ড ডেট স্ক্র্যাপার (সব কোম্পানির)
if (action === 'recorddates') {
  const recordDates = await getRecordDates();
  return res.status(200).json({
    success: true,
    count: recordDates.length,
    marketOpen: isMarketOpen(),
    data: recordDates,
    note: 'AGM এবং রেকর্ড ডেটের তালিকা',
    lastUpdated: new Date().toISOString()
  });
}

// 12. নির্দিষ্ট কোম্পানির রেকর্ড ডেট
if (action === 'company-record' && tradingCode) {
  const allRecords = await getRecordDates();
  const companyRecords = allRecords.filter(r => 
    r.company.toLowerCase().includes(tradingCode.toLowerCase())
  );
  return res.status(200).json({
    success: true,
    tradingCode: tradingCode,
    count: companyRecords.length,
    data: companyRecords
  });
}
    // 10. হেল্প / ডকুমেন্টেশন
    if (action === 'help' || !action) {
      return res.status(200).json({
        success: true,
        message: 'DSE Stock Scraper API Documentation',
        marketOpen: marketStatus,
        endpoints: {
          'Test API': '/api/scrape?action=test',
          'Market Status': '/api/scrape?action=market-status',
          'All Companies': '/api/scrape?action=companies',
          'Search Company': '/api/scrape?action=search&query=GP',
          'Company Details': '/api/scrape?action=details&tradingCode=GP',
          'Market Price': '/api/scrape?action=price&tradingCode=GP',
          'Complete Data': '/api/scrape?action=all&tradingCode=GP',
          'Batch Process': '/api/scrape?action=batch&codes=GP,SQUARE,BATASHUR',
          'Hot Stocks': '/api/scrape?action=hot-stocks'
        },
        sampleCodes: ['GP', 'BATASHUR', 'SQUARE', 'BRACBANK', 'DUTCHBANGLA', 'ROBI', 'BEXIMCO'],
        marketHours: 'Sunday-Thursday, 10:30 AM - 2:30 PM (Bangladesh Time)'
      });
    }
    
    // Invalid action
    return res.status(400).json({
      success: false,
      message: `Invalid action: ${action}`,
      availableActions: ['test', 'companies', 'details', 'price', 'all', 'batch', 'search', 'market-status', 'hot-stocks', 'help']
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
