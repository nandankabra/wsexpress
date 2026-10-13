const { hashPassword } = require('@shiptrack/common');
const userModel = require('../models/userModel');

async function seedDefaultAccounts() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shiptrack.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@ShipTrack2026!';

  // 1. Admin
  const existingAdmin = await userModel.findByEmail(adminEmail);
  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await userModel.create({ name: 'Platform Admin', email: adminEmail, passwordHash, role: 'ADMIN', isVerified: true });
  } else if (!existingAdmin.is_verified) {
    await userModel.updateVerification(existingAdmin.id, true);
  }

  // 2. Demo Customer
  const custEmail = 'customer@shiptrack.com';
  const existingCust = await userModel.findByEmail(custEmail);
  if (!existingCust) {
    const custHash = await hashPassword('Customer@12345!');
    await userModel.create({ name: 'ShipTrack Customer', email: custEmail, passwordHash: custHash, role: 'CUSTOMER', isVerified: true });
  } else if (!existingCust.is_verified) {
    await userModel.updateVerification(existingCust.id, true);
  }

  // 3. Demo Carrier
  const carrEmail = 'carrier@shiptrack.com';
  const existingCarr = await userModel.findByEmail(carrEmail);
  if (!existingCarr) {
    const carrHash = await hashPassword('Carrier@12345!');
    await userModel.create({ name: 'ShipTrack Express Carrier', email: carrEmail, passwordHash: carrHash, role: 'CARRIER', isVerified: true });
  } else if (!existingCarr.is_verified) {
    await userModel.updateVerification(existingCarr.id, true);
  }
}

module.exports = { seedAdmin: seedDefaultAccounts };

