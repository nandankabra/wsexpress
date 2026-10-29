const { buildRouteTable } = require('./proxy/routes');

function startKeepAlive(logger, intervalMs = 4 * 60 * 1000) {
  if (process.env.NODE_ENV === 'test') return;

  const routes = buildRouteTable();
  const uniqueTargets = [
    ...new Set(routes.map((r) => r.target).filter((t) => Boolean(t) && t.startsWith('http'))),
  ];

  if (uniqueTargets.length === 0) return;

  const pingTarget = async (target) => {
    try {
      const url = `${target.replace(/\/+$/, '')}/health`;
      await fetch(url, { signal: AbortSignal.timeout(10000) });
    } catch (_) {}
  };

  const pingAll = async () => {
    await Promise.allSettled(uniqueTargets.map((t) => pingTarget(t)));
  };

  setTimeout(pingAll, 5000);
  const timer = setInterval(pingAll, intervalMs);
  if (timer.unref) timer.unref();
}

module.exports = { startKeepAlive };
