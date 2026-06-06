const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { action, tradingCode } = req.query;
    
    // টেস্ট এন্ডপয়েন্ট
    if (action === 'test') {
      return res.status(200).json({
        success: true,
        message: 'DSE Scraper Working!',
        timestamp: new Date().toISOString()
      });
    }
    
    // সব কোম্পানি
    if (action === 'companies') {
      const response = await axios.get('https://www.dsebd.org/stock_price_yesterday.php');
      const $ = cheerio.load(response.data);
      const companies = [];
      
      $('table tr').each((i, row) => {
        const tds = $(row).find('td');
        if (tds.length >= 2) {
          const code = $(tds[0]).text().trim();
          const name = $(tds[1]).text().trim();
          if (code && code !== 'TRADING CODE' && code.length < 15) {
            companies.push({ code, name });
          }
        }
      });
      
      return res.status(200).json({ success: true, count: companies.length, data: companies.slice(0, 50) });
    }
    
    // নির্দিষ্ট কোম্পানির ডাটা (ওয়ার্কিং)
    if (action === 'all' && tradingCode) {
      const code = tradingCode.toUpperCase();
      console.log(`Fetching data for: ${code}`);
      
      // কোম্পানির বিস্তারিত তথ্য
      const detailUrl = `https://www.dsebd.org/displayCompany.php?name=${code}`;
      const detailRes = await axios.get(detailUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = detailRes.data;
      
      // Share Category - বিভিন্ন প্যাটার্ন চেক
      let shareCategory = 'N/A';
      const catMatch1 = html.match(/Share Category<\/th>\s*<td[^>]*>([^<]+)</i);
      const catMatch2 = html.match(/Category<\/th>\s*<td[^>]*>([^<]+)</i);
      if (catMatch1) shareCategory = catMatch1[1].trim();
      else if (catMatch2) shareCategory = catMatch2[1].trim();
      
      // Listing Year
      let listingYear = 'N/A';
      const yearMatch = html.match(/Listing Year<\/th>\s*<td[^>]*>([^<]+)</i);
      if (yearMatch) listingYear = yearMatch[1].trim();
      
      // Record Date (শুধু তারিখ)
      let recordDate = 'N/A';
      const recordMatch = html.match(/Record Date<\/th>\s*<td[^>]*>([^<]+)</i);
      if (recordMatch) {
        let dateText = recordMatch[1];
        const dateMatch = dateText.match(/\d{2}-\w{3}-\d{4}|\d{4}-\d{2}-\d{2}/);
        recordDate = dateMatch ? dateMatch[0] : dateText.substring(0, 30);
      }
      
      // Cash Dividend (লেটেস্ট)
      let cashDividend = 'N/A';
      const cashMatch = html.match(/Cash Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
      if (cashMatch) {
        let cashText = cashMatch[1];
        let firstCash = cashText.split(',')[0].trim();
        let percentMatch = firstCash.match(/(\d+(?:\.\d+)?)%/);
        cashDividend = percentMatch ? percentMatch[1] + '%' : firstCash;
      }
      
      // Stock Dividend (লেটেস্ট)
      let stockDividend = 'N/A';
      const stockMatch = html.match(/Stock Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
      if (stockMatch) {
        let stockText = stockMatch[1];
        let firstStock = stockText.split(',')[0].trim();
        let percentMatch = firstStock.match(/(\d+(?:\.\d+)?)%/);
        stockDividend = percentMatch ? percentMatch[1] + '%' : firstStock;
      }
      
      // Bonus Dividend (যদি থাকে)
      let bonusDividend = 'N/A';
      const bonusMatch = html.match(/Bonus Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
      if (bonusMatch) {
        let bonusText = bonusMatch[1];
        let percentMatch = bonusText.match(/(\d+(?:\.\d+)?)%/);
        bonusDividend = percentMatch ? percentMatch[1] + '%' : bonusText;
        if (stockDividend === 'N/A') stockDividend = bonusDividend;
      }
      
      // মার্কেট প্রাইস (LTP, High, Low)
      const priceRes = await axios.get('https://www.dsebd.org/latest_share_price_scroll_l.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
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
      
      // মার্কেট খোলা আছে কিনা
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const marketOpen = (day >= 0 && day <= 4 && day !== 5 && day !== 6 && 
                          (hour > 10 || (hour === 10 && now.getMinutes() >= 30)) && 
                          (hour < 14 || (hour === 14 && now.getMinutes() <= 30)));
      
      // রেজাল্ট তৈরি
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
      
      console.log(`Result for ${code}:`, result);
      return res.status(200).json({ success: true, data: result });
    }
    
    // ব্যাচ প্রসেসিং
    if (action === 'batch' && tradingCode) {
      const codes = tradingCode.split(',');
      const results = [];
      
      for (const code of codes) {
        const detailUrl = `https://www.dsebd.org/displayCompany.php?name=${code.trim().toUpperCase()}`;
        try {
          const detailRes = await axios.get(detailUrl);
          const html = detailRes.data;
          
          const cashMatch = html.match(/Cash Dividend<\/th>\s*<td[^>]*>([^<]+)</i);
          const cashDividend = cashMatch ? (cashMatch[1].split(',')[0].match(/(\d+(?:\.\d+)?)%/)?.[1] + '%' || 'N/A') : 'N/A';
          
          results.push({
            tradingCode: code.trim().toUpperCase(),
            cashDividend: cashDividend
          });
        } catch(e) {
          results.push({ tradingCode: code.trim().toUpperCase(), cashDividend: 'Error' });
        }
        await new Promise(r => setTimeout(r, 500));
      }
      
      return res.status(200).json({ success: true, data: results });
    }
    
    return res.status(400).json({ 
      success: false, 
      message: 'Use: ?action=test or ?action=all&tradingCode=GP or ?action=companies' 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};