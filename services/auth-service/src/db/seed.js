const { hashPassword } = require('@shiptrack/common');
const userModel = require('../models/userModel');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await userModel.findByEmail(email);
  if (existing) {
    if (!existing.is_verified) {
      await userModel.updateVerification(existing.id, true);
    }
    return;
  }

  const passwordHash = await hashPassword(password);
  await userModel.create({ name: 'Platform Admin', email, passwordHash, role: 'ADMIN', isVerified: true });
}

module.exports = { seedAdmin };
