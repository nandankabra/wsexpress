const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

function createSqliteAdapter(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbPath);

  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {
    // Ignore pragma error if not supported in env
  }

  return {
    isSqlite: true,
    async query(sql, params = []) {
      let convertedSql = sql
        .replace(/\bINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, '')
        .replace(/\bUNIQUE\s+KEY\s+\w+\s*\(([^)]+)\)/gi, 'UNIQUE ($1)')
        .replace(/\bDECIMAL\(\d+,\s*\d+\)/gi, 'REAL');

      const trimmed = convertedSql.trim();
      if (/^(SELECT|PRAGMA)\b/i.test(trimmed)) {
        const stmt = db.prepare(convertedSql);
        const rows = stmt.all(...params);
        return [rows, []];
      } else {
        const stmt = db.prepare(convertedSql);
        const result = stmt.run(...params);
        return [
          {
            insertId: Number(result.lastInsertRowid),
            affectedRows: result.changes,
          },
          [],
        ];
      }
    },
  };
}

module.exports = { createSqliteAdapter };
