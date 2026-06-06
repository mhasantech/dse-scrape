const axios = require('axios');
const cheerio = require('cheerio');

// CORS Proxy (ব্লক এড়ানোর জন্য)
const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const DSE_BASE = 'https://www.dsebd.org';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { action, tradingCode } = req.query;
    
    // টেস্ট
    if (action === 'test') {
      return res.status(200).json({
        success: true,
        message: 'DSE Scraper Active',
        timestamp: new Date().toISOString()
      });
    }
    
    // সব কোম্পানি
    if (action === 'companies') {
      const url = `${PROXY_URL}${encodeURIComponent(`${DSE_BASE}/stock_price_yesterday.php`)}`;
      const response = await axios.get(url, { timeout: 20000 });
      const $ = cheerio.load(response.data);
      const companies = [];
      
      $('table tr').each((i, row) => {
        const tds = $(row).find('td');
        if (tds.length >= 2) {
          const code = $(tds[0]).text().trim();
          const name = $(tds[1]).text().trim();
          if (code && code !== 'TRADING CODE' && code.length < 20 && code !== 'SCROLL FOR MORE') {
            companies.push({ code, name });
          }
        }
      });
      
      return res.status(200).json({ success: true, count: companies.length, data: companies.slice(0, 50) });
    }
    
    // নির্দিষ্ট কোম্পানির ডাটা
    if (action === 'all' && tradingCode) {
      const code = tradingCode.toUpperCase();
      
      // কোম্পানির ডিটেইলস (Proxy দিয়ে)
      const detailUrl = `${PROXY_URL}${encodeURIComponent(`${DSE_BASE}/displayCompany.php?name=${code}`)}`;
      const detailRes = await axios.get(detailUrl, { timeout: 20000 });
      const html = detailRes.data;
      
      // ডাটা এক্সট্রাক্ট (Regex দিয়ে)
      const extractValue = (pattern) => {
        const match = html.match(pattern);
        return match ? match[1].trim().replace(/\s+/g, ' ') : 'N/A';
      };
      
      // Share Category
      let shareCategory = extractValue(/Share Category<\/th>\s*<td[^>]*>([^<]+)</i);
      if (shareCategory === 'N/A') {
        shareCategory = extractValue(/Category<\/th>\s*<td[^>]*>([^<]+)</i);
      }
      
      // Listing Year
      let listingYear = extractValue(/Listing Year<\/th>\s*<td[^>]*>([^<]+)</i);
      if (listingYear === 'N/A') {
        listingYear = extractValue(/Listed Year<\/th>\s*<td[^>]*>([^<]+)</i);
      }
      
      // Record Date (শুধু তারিখ)
      let recordDate = 'N/A';
      const recordMatch = html.match(/Record Date<\/th>\s*<td[^>]*>([^<]+)</i);
      if (recordMatch) {
        const dateText = recordMatch[1];
        const dateMatch = dateText.match(/\d{2}[-\/]\w{3}[-\/]\d{4}|\d{4}[-\/]\d{2}[-\/]\d{2}/);
        recordDate = dateMatch ? dateMatch[0] : dateText.substring(0, 20);
      }
      
      // Cash Dividend (লেটেস্ট)
      let cashDividend = 'N/A';
      const cashMatch = html.match(/Cash Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
      if (cashMatch) {
        const cashText = cashMatch[1];
        const firstCash = cashText.split(',')[0];
        const percentMatch = firstCash.match(/(\d+(?:\.\d+)?)%/);
        cashDividend = percentMatch ? percentMatch[1] + '%' : firstCash.trim();
      }
      
      // Stock Dividend
      let stockDividend = 'N/A';
      const stockMatch = html.match(/Stock Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
      if (stockMatch) {
        const stockText = stockMatch[1];
        const firstStock = stockText.split(',')[0];
        const percentMatch = firstStock.match(/(\d+(?:\.\d+)?)%/);
        stockDividend = percentMatch ? percentMatch[1] + '%' : firstStock.trim();
      }
      
      // Bonus Dividend (Fallback)
      if (stockDividend === 'N/A') {
        const bonusMatch = html.match(/Bonus Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
        if (bonusMatch) {
          const bonusText = bonusMatch[1];
          const percentMatch = bonusText.match(/(\d+(?:\.\d+)?)%/);
          stockDividend = percentMatch ? percentMatch[1] + '%' : bonusText.trim();
        }
      }
      
      // মার্কেট প্রাইস
      const priceUrl = `${PROXY_URL}${encodeURIComponent(`${DSE_BASE}/latest_share_price_scroll_l.php`)}`;
      const priceRes = await axios.get(priceUrl, { timeout: 20000 });
      const $ = cheerio.load(priceRes.data);
      let ltp = 'N/A', high = 'N/A', low = 'N/A';
      
      $('tr').each((i, row) => {
        const tds = $(row).find('td');
        if (tds.length >= 6) {
          const rowCode = $(tds[0]).text().trim();
          if (rowCode === code) {
            ltp = $(tds[1]).text().trim() || 'N/A';
            high = $(tds[4]).text().trim() || 'N/A';
            low = $(tds[5]).text().trim() || 'N/A';
            return false;
          }
        }
      });
      
      // Market Status
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const marketOpen = (day >= 0 && day <= 4 && day !== 5 && day !== 6 && 
                          (hour > 10 || (hour === 10 && minute >= 30)) && 
                          (hour < 14 || (hour === 14 && minute <= 30)));
      
      const result = {
        tradingCode: code,
        shareCategory: shareCategory,
        listingYear: listingYear,
        recordDate: recordDate,
        cashDividend: cashDividend,
        stockDividend: stockDividend,
        ltp: ltp,
        high: high,
        low: low,
        marketOpen: marketOpen,
        lastUpdated: new Date().toISOString()
      };
      
      return res.status(200).json({ success: true, data: result });
    }
    
    return res.status(400).json({ 
      success: false, 
      message: 'Use: ?action=test or ?action=all&tradingCode=GP or ?action=companies' 
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};