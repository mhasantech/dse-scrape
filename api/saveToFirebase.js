// আলাদা ফাংশন Firebase এ সেভ করার জন্য
async function saveToFirebase(tradingCode, data, collection = 'stocks') {
  try {
    const docRef = db.collection(collection).doc(tradingCode);
    await docRef.set({
      ...data,
      lastScraped: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Saved ${tradingCode} to Firebase`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save ${tradingCode}:`, error);
    return false;
  }
}

// Use this function inside your main scraping logic
