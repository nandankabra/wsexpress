const DEMO_SECRET_MARKERS = ['change-me', 'dev-access', 'dev-refresh'];

function assertProductionConfig({ requireAdmin = false, requireSmtp = false } = {}) {
  if (process.env.NODE_ENV !== 'production') return;

  const errors = [];
  for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = process.env[name] || '';
    if (value.length < 32 || DEMO_SECRET_MARKERS.some((marker) => value.toLowerCase().includes(marker))) {
      errors.push(`${name} must be a strong production secret of at least 32 characters`);
    }
  }

  const origins = process.env.CORS_ORIGIN || '';
  if (!origins || origins.split(',').some((origin) => origin.trim() === '*')) {
    errors.push('CORS_ORIGIN must list explicit production frontend origins');
  }

  if (requireAdmin && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)) {
    errors.push('ADMIN_EMAIL and a strong ADMIN_PASSWORD are required');
  }

  if (requireSmtp && (!process.env.SMTP_HOST || !process.env.SMTP_FROM)) {
    errors.push('SMTP_HOST and SMTP_FROM are required for production email delivery');
  }

  if (errors.length > 0) {
    throw new Error(`Production configuration invalid:\n- ${errors.join('\n- ')}`);
  }
}

module.exports = { assertProductionConfig };
