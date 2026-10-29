/**
 * ShipTrack Render Cloud Keep-Alive Daemon
 * 
 * Periodically pings all deployed Render free-tier services every 3 minutes
 * to prevent them from entering hibernation (15-min idle timeout), completely
 * eliminating cold-start delays and edge "429 Too Many Requests (hibernate-rate-limited)" errors.
 */

const https = require('https');

const ENDPOINTS = [
  'https://shiptrack-frontend-f3ht.onrender.com/',
  'https://shiptrack-api-gateway.onrender.com/health',
  'https://shiptrack-auth-service.onrender.com/health',
  'https://shiptrack-user-service.onrender.com/health',
  'https://shiptrack-carrier-service.onrender.com/health',
  'https://shiptrack-shipment-service.onrender.com/health',
  'https://shiptrack-pricing-service.onrender.com/health',
  'https://shiptrack-location-service.onrender.com/health',
  'https://shiptrack-tracking-service.onrender.com/health',
  'https://shiptrack-crm-service.onrender.com/health',
  'https://shiptrack-audit-service.onrender.com/health',
  'https://shiptrack-notification-service.onrender.com/health',
  'https://shiptrack-graphql-service.onrender.com/health',
];

function ping(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'TIMEOUT' });
    });
  });
}

async function pingAll() {
  const now = new Date().toISOString();
  console.log(`[${now}] ⚡ Pinging all Render cloud endpoints to keep services awake...`);
  const results = await Promise.allSettled(ENDPOINTS.map(ping));
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { url, status, error } = r.value;
      const name = url.replace('https://', '').split('.')[0];
      if (status === 200) {
        console.log(`  ✅ ${name.padEnd(30)} : HTTP ${status} (ACTIVE)`);
      } else {
        console.log(`  ⏳ ${name.padEnd(30)} : ${status ? `HTTP ${status}` : error} (Waking up)`);
      }
    }
  }
}

// Initial ping immediately
pingAll();

// Repeat every 3 minutes (180,000 ms)
const INTERVAL_MS = 3 * 60 * 1000;
setInterval(pingAll, INTERVAL_MS);
console.log(`🚀 Render Keep-Alive daemon is running. Pinging every ${INTERVAL_MS / 1000}s.`);
