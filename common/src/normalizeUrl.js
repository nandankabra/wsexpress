/**
 * Normalizes service URLs.
 * In production on Render's free tier, internal private DNS hostnames (e.g. shiptrack-pricing-service:8006)
 * cannot route over private network. This normalizer maps them to their public HTTPS endpoints
 * (https://shiptrack-pricing-service.onrender.com).
 * For docker-compose (pricing-service:8006) or localhost, it preserves http://.
 */
function normalizeServiceUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const match = url.match(/^(shiptrack-[a-z0-9-]+)(:\d+)?$/i);
  if (match) {
    return `https://${match[1]}.onrender.com`;
  }
  return `http://${url}`;
}

module.exports = { normalizeServiceUrl };
