const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Load root .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const baseEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:5173',
};

const SERVICES = [
  { name: 'auth-service', port: 8001, dir: 'services/auth-service', env: {
    PORT: 8001,
    CRM_SERVICE_URL: 'http://localhost:8008',
    NOTIFICATION_SERVICE_URL: 'http://localhost:8010',
  }},
  { name: 'user-service', port: 8002, dir: 'services/user-service', env: {
    PORT: 8002,
  }},
  { name: 'carrier-service', port: 8003, dir: 'services/carrier-service', env: {
    PORT: 8003,
    CRM_SERVICE_URL: 'http://localhost:8008',
  }},
  { name: 'shipment-service', port: 8004, dir: 'services/shipment-service', env: {
    PORT: 8004,
    PRICING_SERVICE_URL: 'http://localhost:8006',
    TRACKING_SERVICE_URL: 'http://localhost:8005',
    CRM_SERVICE_URL: 'http://localhost:8008',
  }},
  { name: 'tracking-service', port: 8005, dir: 'services/tracking-service', env: {
    PORT: 8005,
  }},
  { name: 'pricing-service', port: 8006, dir: 'services/pricing-service', env: {
    PORT: 8006,
    LOCATION_SERVICE_URL: 'http://localhost:8007',
  }},
  { name: 'location-service', port: 8007, dir: 'services/location-service', env: {
    PORT: 8007,
  }},
  { name: 'crm-service', port: 8008, dir: 'services/crm-service', env: {
    PORT: 8008,
  }},
  { name: 'audit-service', port: 8009, dir: 'services/audit-service', env: {
    PORT: 8009,
  }},
  { name: 'notification-service', port: 8010, dir: 'services/notification-service', env: {
    PORT: 8010,
  }},
  { name: 'graphql-service', port: 8011, dir: 'services/graphql-service', env: {
    PORT: 8011,
    SHIPMENT_SERVICE_URL: 'http://localhost:8004',
    TRACKING_SERVICE_URL: 'http://localhost:8005',
    USER_SERVICE_URL: 'http://localhost:8002',
  }},
  { name: 'api-gateway', port: 8000, dir: 'services/api-gateway', env: {
    PORT: 8000,
    AUTH_SERVICE_URL: 'http://localhost:8001',
    USER_SERVICE_URL: 'http://localhost:8002',
    CARRIER_SERVICE_URL: 'http://localhost:8003',
    SHIPMENT_SERVICE_URL: 'http://localhost:8004',
    TRACKING_SERVICE_URL: 'http://localhost:8005',
    PRICING_SERVICE_URL: 'http://localhost:8006',
    LOCATION_SERVICE_URL: 'http://localhost:8007',
    CRM_SERVICE_URL: 'http://localhost:8008',
    AUDIT_SERVICE_URL: 'http://localhost:8009',
    NOTIFICATION_SERVICE_URL: 'http://localhost:8010',
    GRAPHQL_SERVICE_URL: 'http://localhost:8011',
  }},
];

const processes = [];

function checkHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForService(svc, maxRetries = 50) {
  for (let i = 0; i < maxRetries; i++) {
    const ok = await checkHealth(svc.port);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function start() {
  console.log('🧹 Cleaning up ports 8000-8011...');
  try {
    execSync('kill -9 $(lsof -ti :8000-8011) 2>/dev/null || true');
    await new Promise((r) => setTimeout(r, 1000));
  } catch (e) {}

  console.log('🚀 Starting ShipTrack Microservices Ecosystem...\n');

  for (const svc of SERVICES) {
    const svcDir = path.resolve(__dirname, '..', svc.dir);
    const proc = spawn('node', ['src/server.js'], {
      cwd: svcDir,
      env: { ...baseEnv, ...svc.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`[${svc.name}] ${line}`);
    });

    proc.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line && !line.includes('SECURITY WARNING')) {
        console.error(`[${svc.name}][ERR] ${line}`);
      }
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ [${svc.name}] exited with code ${code}`);
      }
    });

    processes.push({ name: svc.name, proc, port: svc.port });
  }

  console.log('\n⏳ Waiting for all 12 services to become healthy on their ports...');
  const healthResults = await Promise.all(
    SERVICES.map(async (svc) => {
      const ok = await waitForService(svc);
      return { name: svc.name, port: svc.port, ok };
    })
  );

  console.log('\n================ Service Health Report ================');
  let allHealthy = true;
  for (const r of healthResults) {
    if (r.ok) {
      console.log(`  ✅ ${r.name.padEnd(22)} : http://localhost:${r.port} (HEALTHY)`);
    } else {
      console.log(`  ❌ ${r.name.padEnd(22)} : http://localhost:${r.port} (FAILED)`);
      allHealthy = false;
    }
  }
  console.log('=======================================================\n');

  if (allHealthy) {
    console.log('🎉 All ShipTrack backend services are UP and ready!');
    console.log('🌐 API Gateway accessible at: http://localhost:8000');
  } else {
    console.error('⚠️  Some services failed to report healthy within timeout.');
  }
}

function cleanup() {
  console.log('\n🛑 Shutting down all microservices...');
  for (const p of processes) {
    try {
      p.proc.kill('SIGTERM');
    } catch (e) {}
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

start().catch((err) => {
  console.error('Fatal launcher error:', err);
  cleanup();
});
