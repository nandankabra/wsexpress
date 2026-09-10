const mongoose = require('mongoose');

async function connect() {
  const url = process.env.MONGO_URL;
  if (!url) {
    console.warn('[audit-service] MONGO_URL not provided');
    return;
  }

  const tryConnect = async () => {
    try {
      await mongoose.connect(url, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log('[audit-service] Connected to MongoDB Atlas successfully');
    } catch (err) {
      console.error('[audit-service] MongoDB Atlas connection error (will retry in 8s):', err.message);
      setTimeout(tryConnect, 8000);
    }
  };

  await tryConnect();
}

module.exports = { connect, mongoose };
