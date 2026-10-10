const path = require('path');
const { createSqliteAdapter } = require('./sqliteAdapter');

const connectionUri = process.env.MYSQL_URL;
let activePool = null;

async function getPool() {
  if (activePool) return activePool;

  if (connectionUri && connectionUri.startsWith('mysql://')) {
    let testPool = null;
    try {
      const mysql = require('mysql2/promise');
      testPool = mysql.createPool(connectionUri);
      testPool.on('error', () => {});

      // Verify connection with a short timeout
      await Promise.race([
        testPool.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MySQL connection timeout')), 3000)),
      ]);

      activePool = testPool;
      return activePool;
    } catch (err) {
      if (testPool) {
        testPool.end().catch(() => {});
      }
      console.warn(`[pricing-service] Notice: MySQL unavailable (${err.message}). Falling back to local SQLite database.`);
    }
  }

  const dbPath = path.resolve(__dirname, '../../../../.data/pricing.db');
  activePool = createSqliteAdapter(dbPath);
  return activePool;
}

const pool = {
  async query(sql, params) {
    const p = await getPool();
    return p.query(sql, params);
  },
};

module.exports = { pool };
