const mongoose = require('mongoose');

function buildUriFromEnv() {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || '127.0.0.1';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DB_NAME || 'test';

  if (user && pass) {
    // encode components to be safe with special characters
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(pass);
    // default to authSource=admin which is common for authenticated setups
    return `mongodb://${u}:${p}@${host}:${port}/${db}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${db}`;
}

async function connectDB(uri) {
  const finalUri = uri || buildUriFromEnv();

  try {
    // use a short serverSelectionTimeout for faster failures during development
    await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // stop server if db fails
  }
}

module.exports = connectDB;
