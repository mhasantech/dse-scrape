const axios = require('axios');
const cheerio = require('cheerio');

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
        const url = 'https://www.cse.com.bd/company/listedcompanies';
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const companies = [];

        $('table tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 2) {
                const code = $(tds[0]).text().trim();
                const name = $(tds[1]).text().trim();
                if (code && name && code !== 'TRADING CODE' && name !== 'Company Name') {
                    companies.push({ code, name });
                }
            }
        });
        return companies;
    } catch (error) {
        console.error('Error:', error.message);
        return [];
    }
}

// Get company details
async function getCompanyDetails(tradingCode) {
    try {
        const url = `https://www.cse.com.bd/company/info/${tradingCode}`;
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const details = { tradingCode, scrapedAt: new Date().toISOString() };

        $('tr').each((i, row) => {
            const text = $(row).text().toLowerCase();
            const value = $(row).find('td').last().text().trim();
            
            if (text.includes('share category')) details.shareCategory = value;
            if (text.includes('listing year')) details.listingYear = value;
            if (text.includes('cash dividend')) details.cashDividend = value;
            if (text.includes('stock dividend')) details.stockDividend = value;
            if (text.includes('record date')) details.recordDate = extractDateOnly(value);
        });
        return details;
    } catch (error) {
        return { tradingCode, error: error.message };
    }
}

// Get market price
async function getMarketPrice(tradingCode) {
    try {
        const url = 'https://www.cse.com.bd/market/current_price';
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let priceData = { tradingCode, ltp: 'N/A', high: 'N/A', low: 'N/A' };

        $(`tr:contains("${tradingCode}")`).each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 5) {
                priceData = {
                    tradingCode,
                    ltp: $(tds[1]).text().trim() || 'N/A',
                    high: $(tds[3]).text().trim() || 'N/A',
                    low: $(tds[4]).text().trim() || 'N/A'
                };
                return false;
            }
        });
        return priceData;
    } catch (error) {
        return { tradingCode, ltp: 'Error' };
    }
}

// Get record dates
async function getRecordDates() {
    try {
        const url = 'https://www.cse.com.bd/company/recorddates';
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const records = [];

        $('tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 4) {
                const company = $(tds[1]).text().trim();
                const recordDate = $(tds[3]).text().trim();
                if (company && recordDate && recordDate !== '-') {
                    records.push({
                        company: company,
                        recordDate: extractDateOnly(recordDate)
                    });
                }
            }
        });
        return records;
    } catch (error) {
        console.error('Record Dates Error:', error.message);
        return [];
    }
}

// API Handler
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { action, tradingCode } = req.query;

    try {
        if (action === 'test') {
            return res.json({ success: true, message: 'CSE Scraper Active', timestamp: new Date().toISOString() });
        }
        if (action === 'companies') {
            const companies = await getAllCompanies();
            return res.json({ success: true, count: companies.length, data: companies });
        }
        if (action === 'details' && tradingCode) {
            const details = await getCompanyDetails(tradingCode.toUpperCase());
            return res.json({ success: true, data: details });
        }
        if (action === 'price' && tradingCode) {
            const price = await getMarketPrice(tradingCode.toUpperCase());
            return res.json({ success: true, data: price });
        }
        if (action === 'all' && tradingCode) {
            const code = tradingCode.toUpperCase();
            const [details, price] = await Promise.all([
                getCompanyDetails(code),
                getMarketPrice(code)
            ]);
            return res.json({ success: true, data: { details, price, lastUpdated: new Date().toISOString() } });
        }
        if (action === 'recorddates') {
            const records = await getRecordDates();
            return res.json({ success: true, count: records.length, data: records });
        }
        
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid action. Use: test, companies, details, price, all, recorddates' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
