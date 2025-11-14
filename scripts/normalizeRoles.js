const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const path = require('path');
const User = require(path.join(__dirname, '..', 'src', 'models', 'User'));

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_ATLAS || process.env.MONGO_DB_URI;
  if (!uri) {
    console.error('No MongoDB connection string found in environment (MONGO_URI).');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  console.log('Scanning users for legacy role values...');
  const users = await User.find({ role: { $exists: true } }).lean();
  let updated = 0;

  for (const u of users) {
    if (!u.role || typeof u.role !== 'string') continue;
    const orig = u.role;
    const trimmed = orig.trim();
    const mapped = trimmed === 'admin' ? 'hr_manager' : trimmed;
    if (mapped !== orig) {
      console.log(`Updating ${u.email || u._id}: "${orig}" -> "${mapped}"`);
      await User.updateOne({ _id: u._id }, { $set: { role: mapped } });
      updated++;
    }
  }

  console.log(`Done. Updated ${updated} user(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
