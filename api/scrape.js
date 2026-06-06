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
  
  if (day === 5 || day === 6) return false;
  
  const timeNow = hour * 60 + minute;
  const marketStart = 10 * 60 + 30;
  const marketEnd = 14 * 60 + 30;
  
  return timeNow >= marketStart && timeNow <= marketEnd;
}

// তারিখ এক্সট্রাক্ট করার ফাংশন
function extractDateOnly(text) {
  if (!text || text === 'N/A' || text === '-') return 'N/A';
  
  const cleanText = text.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  const datePatterns = [
    /\d{2}-\w{3}-\d{4}/,
    /\d{4}-\d{2}-\d{2}/,
    /\d{2}\/\d{2}\/\d{4}/,
    /\d{2}-\d{2}-\d{4}/,
    /\d{1,2}\s+\w+\s+\d{4}/
  ];
  
  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match) return match[0];
  }
  
  return cleanText.substring(0, 30);
}

// ============= CSE থেকে রেকর্ড ডেট আনা =============
async function getRecordDatesFromCSE() {
  try {
    console.log('📅 Fetching record dates from CSE...');
    const response = await axios.get('https://www.cse.com.bd/company/recorddates', {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    const $ = cheerio.load(response.data);
    const recordDates = [];
    
    $('table tbody tr').each((i, row) => {
      const tds = $(row).find('td');
      
      if (tds.length >= 5) {
        const company = $(tds[1]).text().trim();
        const recordDate = $(tds[4]).text().trim();
        
        if (company && company !== 'Company' && company.length > 2 && recordDate && recordDate !== '-') {
          const cleanRecordDate = extractDateOnly(recordDate);
          
          if (cleanRecordDate !== 'N/A') {
            recordDates.push({
              company: company,
              recordDate: cleanRecordDate,
              source: 'CSE',
              scrapedAt: new Date().toISOString()
            });
          }
        }
      }
    });
    
    console.log(`✅ CSE: Found ${recordDates.length} record dates`);
    return recordDates;
    
  } catch (error) {
    console.error('CSE scraping failed:', error.message);
    return [];
  }
}

// ============= DSE থেকে কোম্পানির ডিটেইলস (Record Date ছাড়া) =============
async function getCompanyDetails(tradingCode) {
  try {
    const url = `https://www.dsebd.org/displayCompany.php?name=${tradingCode}`;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
    const $ = cheerio.load(response.data);
    const details = { 
      tradingCode: tradingCode,
      scrapedAt: new Date().toISOString()
    };
    
    $('table tr').each((i, row) => {
      const text = $(row).text().toLowerCase();
      
      if (text.includes('share category')) {
        const value = $(row).find('td').last().text().trim();
        if (value) details.shareCategory = value;
      }
      
      if (text.includes('listing year')) {
        const value = $(row).find('td').last().text().trim();
        if (value) details.listingYear = value;
      }
      
      if (text.includes('cash dividend')) {
        const value = $(row).find('td').last().text().trim();
        if (value) details.cashDividend = value;
      }
      
      if (text.includes('stock dividend')) {
        const value = $(row).find('td').last().text().trim();
        if (value) details.stockDividend = value;
      }
      
      if (text.includes('dividend') && !text.includes('cash') && !text.includes('stock')) {
        const value = $(row).find('td').last().text().trim();
        if (value) details.dividend = value;
      }
    });
    
    // Record Date CSE থেকে নেওয়ার জন্য রাখা (খালি)
    details.recordDate = 'N/A';
    
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${tradingCode}:`, error.message);
    return { tradingCode, error: error.message, scrapedAt: new Date().toISOString() };
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
    console.error(`Error fetching price:`, error.message);
    return { tradingCode, ltp: 'Error', marketOpen: isMarketOpen(), scrapedAt: new Date().toISOString() };
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
        if (code && name && code !== 'TRADING CODE' && code.length < 20) {
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

// ============= MAIN API HANDLER =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, tradingCode, codes } = req.query;
    const marketOpen = isMarketOpen();
    
    // 1. টেস্ট
    if (action === 'test') {
      return res.status(200).json({
        success: true,
        message: 'DSE Scraper API is running! (Record Date from CSE)',
        marketOpen: marketOpen,
        timestamp: new Date().toISOString()
      });
    }
    
    // 2. সব কোম্পানি
    if (action === 'companies') {
      const companies = await getAllCompanies();
      return res.status(200).json({ success: true, count: companies.length, data: companies });
    }
    
    // 3. শুধু ডিটেইলস (Record Date N/A)
    if (action === 'details' && tradingCode) {
      const details = await getCompanyDetails(tradingCode.toUpperCase());
      return res.status(200).json({ success: true, data: details });
    }
    
    // 4. শুধু প্রাইস
    if (action === 'price' && tradingCode) {
      const price = await getMarketPrice(tradingCode.toUpperCase());
      return res.status(200).json({ success: true, data: price });
    }
    
    // 5. সব ডাটা (Record Date CSE থেকে এনে যোগ করা হবে)
    if (action === 'all' && tradingCode) {
      const code = tradingCode.toUpperCase();
      const [details, price, allRecords] = await Promise.all([
        getCompanyDetails(code),
        getMarketPrice(code),
        getRecordDatesFromCSE()
      ]);
      
      // CSE থেকে রেকর্ড ডেট খোঁজা
      const recordMatch = allRecords.find(r => 
        r.company.toLowerCase().includes(code.toLowerCase()) ||
        code.toLowerCase().includes(r.company.toLowerCase().split(' ')[0])
      );
      
      if (recordMatch && recordMatch.recordDate) {
        details.recordDate = recordMatch.recordDate;
      }
      
      await saveToFirebase(code, details, price);
      
      const result = {
        tradingCode: code,
        shareCategory: details.shareCategory || 'N/A',
        listingYear: details.listingYear || 'N/A',
        recordDate: details.recordDate,
        cashDividend: details.cashDividend || 'N/A',
        stockDividend: details.stockDividend || 'N/A',
        ltp: price.ltp,
        high: price.high,
        low: price.low,
        marketOpen: marketOpen,
        lastUpdated: new Date().toISOString()
      };
      
      return res.status(200).json({ success: true, data: result });
    }
    
    // 6. CSE রেকর্ড ডেট (সব)
    if (action === 'recorddates') {
      const recordDates = await getRecordDatesFromCSE();
      return res.status(200).json({
        success: true,
        source: 'CSE',
        count: recordDates.length,
        marketOpen: marketOpen,
        data: recordDates,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // 7. নির্দিষ্ট কোম্পানির রেকর্ড ডেট
    if (action === 'company-record' && tradingCode) {
      const allRecords = await getRecordDatesFromCSE();
      const searchTerm = tradingCode.toUpperCase();
      const found = allRecords.filter(r => 
        r.company.toUpperCase().includes(searchTerm)
      );
      return res.status(200).json({
        success: true,
        tradingCode: tradingCode,
        count: found.length,
        data: found
      });
    }
    
    // 8. মার্কেট স্ট্যাটাস
    if (action === 'market-status') {
      return res.status(200).json({
        success: true,
        marketOpen: marketOpen,
        currentTime: new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })
      });
    }
    
    // 9. হেল্প
    if (action === 'help' || !action) {
      return res.status(200).json({
        success: true,
        message: 'DSE Stock Scraper API (Record Date from CSE)',
        marketOpen: marketOpen,
        endpoints: {
          test: '?action=test',
          'market-status': '?action=market-status',
          companies: '?action=companies',
          'stock-details': '?action=details&tradingCode=GP',
          price: '?action=price&tradingCode=GP',
          'all-data': '?action=all&tradingCode=GP',
          'cse-recorddates': '?action=recorddates',
          'search-record': '?action=company-record&tradingCode=EBL'
        },
        note: 'Record Date আসছে CSE (Chittagong Stock Exchange) থেকে'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid action',
      availableActions: ['test', 'market-status', 'companies', 'details', 'price', 'all', 'recorddates', 'company-record', 'help']
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};