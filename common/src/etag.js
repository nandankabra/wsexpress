const crypto = require('crypto');

function computeEtag(body) {
  const hash = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex');
  return `"${hash}"`;
}

/**
 * Middleware for single-resource GET routes: wraps res.json to compute a strong ETag,
 * short-circuits with 304 when the client's If-None-Match matches.
 */
function etag() {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const tag = computeEtag(body);
      res.setHeader('ETag', tag);
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === tag) {
        return res.status(304).end();
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { etag, computeEtag };
