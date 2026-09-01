const { createProxyMiddleware } = require('http-proxy-middleware');

const TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS) || 5000;

/**
 * Wraps http-proxy-middleware with correlation-id propagation and a JSON error response
 * (matching @shiptrack/common's error shape) instead of the library's default HTML/plain-text
 * error page when the upstream service is unreachable or times out.
 *
 * `app.use(mountPath, proxy)` makes Express strip `mountPath` from `req.url` before the proxy
 * ever sees it, so without pathRewrite the upstream would receive e.g. `/register` instead of
 * `/api/v1/auth/register` - every downstream route is mounted at the full prefix, so this must
 * be restored.
 */
function createServiceProxy(target, serviceName, mountPath) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: TIMEOUT_MS,
    proxyTimeout: TIMEOUT_MS,
    pathRewrite: (path) => `${mountPath}${path}`,
    on: {
      proxyReq(proxyReq, req) {
        if (req.correlationId) {
          proxyReq.setHeader('X-Correlation-Id', req.correlationId);
        }
      },
      error(err, req, res) {
        if (req.log) req.log.error({ err, target, serviceName }, 'Upstream proxy error');
        if (res.headersSent) return;
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: `${serviceName} is currently unavailable`,
              service: 'api-gateway',
              correlationId: req.correlationId,
              timestamp: new Date().toISOString(),
            },
          }),
        );
      },
    },
  });
}

module.exports = { createServiceProxy };
