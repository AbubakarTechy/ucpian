require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../db');

function migrate() {
  const db = connectDB();

  const proResult = db.prepare("UPDATE users SET plan = 'Ultra' WHERE plan = 'Pro'").run();
  const basicResult = db.prepare("UPDATE users SET plan = 'Pro' WHERE plan = 'Basic'").run();
  const freeResult = db.prepare("UPDATE users SET plan = 'Basic' WHERE plan = 'Free'").run();

  console.log('Migrated Pro -> Ultra:', proResult.changes);
  console.log('Migrated Basic -> Pro:', basicResult.changes);
  console.log('Migrated Free -> Basic:', freeResult.changes);
}

migrate();
