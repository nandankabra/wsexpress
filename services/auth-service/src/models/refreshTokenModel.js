const crypto = require('crypto');
const { pool } = require('../db/pool');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function store({ userId, token, expiresAt }) {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(token), expiresAt],
  );
}

async function findActive(token) {
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked = FALSE AND expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] || null;
}

async function revoke(token) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [hashToken(token)]);
}

async function revokeAllForUser(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
}

module.exports = { store, findActive, revoke, revokeAllForUser, hashToken };
