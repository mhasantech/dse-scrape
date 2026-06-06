const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// ============= SSL সমস্যা সমাধান =============
const agent = new https.Agent({
  rejectUnauthorized: false
});

const cseAxios = axios.create({
  httpsAgent: agent,
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  }
});

// Helper function
function extractDateOnly(text) {
    if (!text || text === 'N/A') return 'N/A';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/;
    const match = cleanText.match(datePattern);
    return match ? match[0] : cleanText.substring(0, 30);
}

// Get all companies
async function getAllCompanies() {
    try {
        console.log('Fetching companies from CSE...');
        const { data } = await cseAxios.get('https://www.cse.com.bd/company/listedcompanies');
        const $ = cheerio.load(data);
        const companies = [];

        $('table tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 2) {
                const code = $(tds[0]).text().trim();
                const name = $(tds[1]).text().trim();
                if (code && name && code !== 'TRADING CODE' && name !== 'Company Name' && code.length < 20) {
                    companies.push({ code, name });
                }
            }
        });
        
        console.log(`Found ${companies.length} companies`);
        return companies.slice(0, 50);
    } catch (error) {
        console.error('Companies Error:', error.message);
        return [];
    }
}

// Get company details
async function getCompanyDetails(tradingCode) {
    try {
        console.log(`Fetching details for ${tradingCode}...`);
        const url = `https://www.cse.com.bd/company/info/${tradingCode}`;
        const { data } = await cseAxios.get(url);
        const $ = cheerio.load(data);
        const details = { 
            tradingCode, 
            scrapedAt: new Date().toISOString(),
            shareCategory: 'N/A',
            listingYear: 'N/A',
            cashDividend: 'N/A',
            stockDividend: 'N/A',
            recordDate: 'N/A'
        };

        $('tr').each((i, row) => {
            const text = $(row).text().toLowerCase();
            const value = $(row).find('td').last().text().trim();
            
            if (text.includes('share category') && value) details.shareCategory = value;
            if (text.includes('listing year') && value) details.listingYear = value;
            if (text.includes('cash dividend') && value) details.cashDividend = value;
            if (text.includes('stock dividend') && value) details.stockDividend = value;
            if (text.includes('record date') && value) details.recordDate = extractDateOnly(value);
            if (text.includes('face value') && value) details.faceValue = value;
            if (text.includes('paid up capital') && value) details.paidUpCapital = value;
        });
        
        return details;
    } catch (error) {
        console.error(`Details Error ${tradingCode}:`, error.message);
        return { tradingCode, error: error.message, scrapedAt: new Date().toISOString() };
    }
}

// Get market price
async function getMarketPrice(tradingCode) {
    try {
        console.log(`Fetching price for ${tradingCode}...`);
        const { data } = await cseAxios.get('https://www.cse.com.bd/market/current_price');
        const $ = cheerio.load(data);
        let priceData = { 
            tradingCode, 
            ltp: 'N/A', 
            high: 'N/A', 
            low: 'N/A',
            scrapedAt: new Date().toISOString()
        };

        $(`tr`).each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 5) {
                const code = $(tds[0]).text().trim();
                if (code.toUpperCase() === tradingCode.toUpperCase()) {
                    priceData = {
                        tradingCode,
                        ltp: $(tds[1]).text().trim() || 'N/A',
                        high: $(tds[3]).text().trim() || 'N/A',
                        low: $(tds[4]).text().trim() || 'N/A',
                        scrapedAt: new Date().toISOString()
                    };
                    return false;
                }
            }
        });
        
        return priceData;
    } catch (error) {
        console.error(`Price Error ${tradingCode}:`, error.message);
        return { tradingCode, ltp: 'Error', high: 'N/A', low: 'N/A' };
    }
}

// Get record dates
async function getRecordDates() {
    try {
        console.log('Fetching record dates from CSE...');
        const { data } = await cseAxios.get('https://www.cse.com.bd/company/recorddates');
        const $ = cheerio.load(data);
        const records = [];

        $('tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 4) {
                const company = $(tds[1]).text().trim();
                const recordDate = $(tds[3]).text().trim();
                if (company && recordDate && recordDate !== '-' && company !== 'Company') {
                    records.push({
                        company: company,
                        recordDate: extractDateOnly(recordDate),
                        source: 'CSE'
                    });
                }
            }
        });
        
        console.log(`Found ${records.length} record dates`);
        return records;
    } catch (error) {
        console.error('Record Dates Error:', error.message);
        return [];
    }
}

// Get market status
function isMarketOpen() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Friday (5) or Saturday (6) closed
    if (day === 5 || day === 6) return false;
    
    const timeNow = hour * 60 + minute;
    const marketStart = 10 * 60 + 30;
    const marketEnd = 14 * 60 + 30;
    
    return timeNow >= marketStart && timeNow <= marketEnd;
}

// ============= API HANDLER =============
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { action, tradingCode } = req.query;
    const marketOpen = isMarketOpen();

    try {
        // Test endpoint
        if (action === 'test') {
            return res.json({ 
                success: true, 
                message: 'CSE Scraper Active (SSL Fixed)', 
                marketOpen: marketOpen,
                timestamp: new Date().toISOString() 
            });
        }
        
        // Get all companies
        if (action === 'companies') {
            const companies = await getAllCompanies();
            return res.json({ success: true, count: companies.length, data: companies });
        }
        
        // Get company details only
        if (action === 'details' && tradingCode) {
            const details = await getCompanyDetails(tradingCode.toUpperCase());
            return res.json({ success: true, data: details });
        }
        
        // Get market price only
        if (action === 'price' && tradingCode) {
            const price = await getMarketPrice(tradingCode.toUpperCase());
            return res.json({ success: true, data: price });
        }
        
        // Get all data (details + price)
        if (action === 'all' && tradingCode) {
            const code = tradingCode.toUpperCase();
            const [details, price] = await Promise.all([
                getCompanyDetails(code),
                getMarketPrice(code)
            ]);
            
            const result = {
                tradingCode: code,
                shareCategory: details.shareCategory,
                listingYear: details.listingYear,
                recordDate: details.recordDate,
                cashDividend: details.cashDividend,
                stockDividend: details.stockDividend,
                ltp: price.ltp,
                high: price.high,
                low: price.low,
                marketOpen: marketOpen,
                lastUpdated: new Date().toISOString()
            };
            
            return res.json({ success: true, data: result });
        }
        
        // Get record dates list
        if (action === 'recorddates') {
            const records = await getRecordDates();
            return res.json({ success: true, count: records.length, data: records });
        }
        
        // Help
        if (action === 'help' || !action) {
            return res.json({
                success: true,
                message: 'CSE Stock Scraper API',
                marketOpen: marketOpen,
                endpoints: {
                    test: '?action=test',
                    companies: '?action=companies',
                    details: '?action=details&tradingCode=EBL',
                    price: '?action=price&tradingCode=EBL',
                    all: '?action=all&tradingCode=EBL',
                    recorddates: '?action=recorddates'
                }
            });
        }
        
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid action. Use: test, companies, details, price, all, recorddates, help' 
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
