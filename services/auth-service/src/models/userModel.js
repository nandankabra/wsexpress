const { pool } = require('../db/pool');

async function create({ name, email, passwordHash, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role],
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

module.exports = { create, findByEmail, findById };
