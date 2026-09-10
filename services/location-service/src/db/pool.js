const mysql = require('mysql2/promise');

const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;

const pool = connectionUri
  ? mysql.createPool(connectionUri)
  : mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
    });

module.exports = { pool };
