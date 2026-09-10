const { pool } = require('../db/pool');

async function createToken(userId, tokenHash, type, expiresAt) {
  await pool.query(
    'INSERT INTO verification_tokens (user_id, token_hash, type, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, tokenHash, type, expiresAt],
  );
}

async function findValidToken(userId, type, tokenHash) {
  const { rows } = await pool.query(
    'SELECT * FROM verification_tokens WHERE user_id = $1 AND type = $2 AND token_hash = $3 AND expires_at > now()',
    [userId, type, tokenHash],
  );
  return rows[0] || null;
}

async function revokeTokens(userId, type) {
  await pool.query('DELETE FROM verification_tokens WHERE user_id = $1 AND type = $2', [userId, type]);
}

module.exports = { createToken, findValidToken, revokeTokens };
