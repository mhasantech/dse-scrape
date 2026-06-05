const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Firebase ইতিমধ্যে initialized কিনা চেক করুন (Serverless এ গুরুত্বপূর্ণ)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  try {
    // 1. ডাটা scrape করুন (উদাহরণ: DSE ওয়েবসাইট)
    const { data } = await axios.get('https://www.dsebd.org/displayCompany.php?name=BATASHUR');
    const $ = cheerio.load(data);
    
    // 2. HTML থেকে ভ্যালুগুলো বের করুন (আসল ওয়েবসাইট অনুযায়ী সিলেক্টর পরিবর্তন করতে হবে)
    const ltp = $('.table tr:nth-child(1) td:nth-child(2)').text().trim();
    const high = $('.table tr:nth-child(2) td:nth-child(2)').text().trim();

    // 3. Firebase এ সেভ করুন
    await db.collection('stocks').doc('BATASHUR').set({
      ltp: parseFloat(ltp) || 0,
      high: parseFloat(high) || 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }); // merge: true মানে পুরনো ডাটা না হারিয়ে আপডেট করা

    res.status(200).json({ message: 'Data scraped successfully!' });
  } catch (error) {
    console.error("Scraping failed:", error);
    res.status(500).json({ error: error.message });
  }
}
