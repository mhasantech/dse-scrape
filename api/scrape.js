// api/cseScraper.js
const axios = require('axios');
const cheerio = require('cheerio');

// ----- হেল্পার ফাংশন (তারিখ বের করার জন্য) -----
function extractDateOnly(text) {
    if (!text || text === 'N/A') return 'N/A';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const datePattern = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|[A-Za-z]{3}\s+\d{1,2},\s+\d{4})\b/i;
    const match = cleanText.match(datePattern);
    return match ? match[0] : cleanText.substring(0, 30);
}

// ----- ১. সব কোম্পানির তালিকা -----
async function getAllCompanies() {
    try {
        const url = 'https://www.cse.com.bd/company/listedcompanies';
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const companies = [];

        $('table tbody tr, .company-list tbody tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 2) {
                const code = $(tds[0]).text().trim();
                const name = $(tds[1]).text().trim();
                if (code && name && !name.toLowerCase().includes('company')) {
                    companies.push({ code, name });
                }
            }
        });
        return companies;
    } catch (error) {
        console.error('CSE Companies Error:', error.message);
        return [];
    }
}

// ----- ২. কোম্পানির বিস্তারিত তথ্য -----
async function getCompanyDetails(tradingCode) {
    try {
        const url = `https://www.cse.com.bd/company/info/${tradingCode}`;
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const details = { tradingCode, scrapedAt: new Date().toISOString() };

        $('table tr, .info-row').each((i, row) => {
            const label = $(row).find('th, .label').text().toLowerCase();
            const value = $(row).find('td, .value').text().trim();

            if (label.includes('share category')) details.shareCategory = value;
            if (label.includes('listing year')) details.listingYear = value;
            if (label.includes('cash dividend')) details.cashDividend = value;
            if (label.includes('stock dividend')) details.stockDividend = value;
            if (label.includes('record date')) details.recordDate = extractDateOnly(value);
            if (label.includes('face value')) details.faceValue = value;
            if (label.includes('paid up capital')) details.paidUpCapital = value;
            if (label.includes('eps')) details.eps = value;
        });
        return details;
    } catch (error) {
        console.error(`Details Error ${tradingCode}:`, error.message);
        return { tradingCode, error: error.message };
    }
}

// ----- ৩. মার্কেট প্রাইস (LTP, High, Low) -----
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
        console.error(`Price Error ${tradingCode}:`, error.message);
        return { tradingCode, ltp: 'Error' };
    }
}

// ----- ৪. রেকর্ড ডেটের তালিকা -----
async function getRecordDates() {
    try {
        const url = 'https://www.cse.com.bd/company/recorddates';
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const records = [];

        $('table tbody tr').each((i, row) => {
            const tds = $(row).find('td');
            if (tds.length >= 4) {
                const company = $(tds[1]).text().trim();
                const recordDate = $(tds[3]).text().trim();
                if (company && recordDate && recordDate !== '-') {
                    records.push({
                        company,
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

// ----- Vercel API হ্যান্ডলার -----
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
            const [details, price] = await Promise.all([getCompanyDetails(code), getMarketPrice(code)]);
            return res.json({ success: true, data: { details, price, lastUpdated: new Date().toISOString() } });
        }
        if (action === 'recorddates') {
            const records = await getRecordDates();
            return res.json({ success: true, count: records.length, data: records });
        }
        return res.status(400).json({ success: false, message: 'Invalid action. Use: test, companies, details, price, all, recorddates' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};