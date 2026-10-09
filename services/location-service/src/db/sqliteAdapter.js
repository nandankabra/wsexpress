let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  DatabaseSync = null;
}
const path = require('path');
const fs = require('fs');

function createSqliteAdapter(dbPath) {
  if (!DatabaseSync) {
    // In-memory fallback for Node < 22.5 (e.g. Node 20 in CI/Docker)
    const countries = new Map();
    const cities = [];
    const warehouses = [];
    const routes = new Map();

    return {
      isSqlite: true,
      async query(sql, params = []) {
        const trimmed = sql.trim();
        if (/CREATE\s+TABLE/i.test(trimmed) || /PRAGMA/i.test(trimmed)) {
          return [[], []];
        }
        if (/SELECT\s+1\b/i.test(trimmed)) {
          return [[{ 1: 1 }], []];
        }
        if (/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM\s+countries/i.test(trimmed)) {
          return [[{ count: countries.size }], []];
        }
        if (/SELECT\s+\*\s+FROM\s+countries\s+WHERE\s+code\s*=\s*\?/i.test(trimmed)) {
          const c = countries.get(String(params[0]).toUpperCase());
          return [c ? [c] : [], []];
        }
        if (/SELECT\s+\*\s+FROM\s+countries\s+ORDER\s+BY/i.test(trimmed)) {
          const list = Array.from(countries.values()).sort((a, b) => a.name.localeCompare(b.name));
          return [list, []];
        }
        if (/SELECT\s+\*\s+FROM\s+cities\s+WHERE\s+country_code\s*=\s*\?/i.test(trimmed)) {
          const code = String(params[0]).toUpperCase();
          const list = cities.filter((c) => c.country_code === code);
          return [list, []];
        }
        if (/SELECT\s+\*\s+FROM\s+cities\s+ORDER\s+BY/i.test(trimmed)) {
          return [cities, []];
        }
        if (/SELECT\s+\*\s+FROM\s+warehouses/i.test(trimmed)) {
          return [warehouses, []];
        }
        if (/SELECT\s+\*\s+FROM\s+delivery_routes\s+WHERE\s+origin_country\s*=\s*\?\s+AND\s+destination_country\s*=\s*\?/i.test(trimmed)) {
          const key = `${String(params[0]).toUpperCase()}_${String(params[1]).toUpperCase()}`;
          const r = routes.get(key);
          return [r ? [r] : [], []];
        }
        if (/SELECT\s+\*\s+FROM\s+delivery_routes\s+ORDER\s+BY/i.test(trimmed)) {
          return [Array.from(routes.values()), []];
        }
        if (/INSERT\s+INTO\s+countries/i.test(trimmed)) {
          const [code, name, capital, currency] = params;
          const entry = { code: code.toUpperCase(), name, capital, currency: currency.toUpperCase() };
          countries.set(code.toUpperCase(), entry);
          return [{ insertId: 1, affectedRows: 1 }, []];
        }
        if (/INSERT\s+INTO\s+delivery_routes/i.test(trimmed)) {
          const [origin, dest, days] = params;
          const key = `${origin.toUpperCase()}_${dest.toUpperCase()}`;
          const entry = { id: routes.size + 1, origin_country: origin.toUpperCase(), destination_country: dest.toUpperCase(), transit_days: days };
          routes.set(key, entry);
          return [{ insertId: entry.id, affectedRows: 1 }, []];
        }
        if (/INSERT\s+INTO\s+cities/i.test(trimmed)) {
          const [name, code] = params;
          const entry = { id: cities.length + 1, name, country_code: code.toUpperCase() };
          cities.push(entry);
          return [{ insertId: entry.id, affectedRows: 1 }, []];
        }
        if (/INSERT\s+INTO\s+warehouses/i.test(trimmed)) {
          const [name, city, code, addr] = params;
          const entry = { id: warehouses.length + 1, name, city, country_code: code.toUpperCase(), address: addr };
          warehouses.push(entry);
          return [{ insertId: entry.id, affectedRows: 1 }, []];
        }
        return [[], []];
      },
    };
  }

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
