const { pool } = require('../db/pool');

async function create({ name, email, passwordHash, role, isVerified = false }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, is_active, is_verified, created_at`,
    [name, email, passwordHash, role, isVerified],
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, is_active, is_verified, created_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

async function updateVerification(id, isVerified) {
  await pool.query('UPDATE users SET is_verified = $1, updated_at = now() WHERE id = $2', [isVerified, id]);
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, id]);
}

module.exports = { create, findByEmail, findById, updateVerification, updatePassword };
