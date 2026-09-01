const { parse: toXml } = require('js2xmlparser');

/**
 * Honors Accept: application/xml by wrapping res.json to also serialize as XML.
 * Defaults to JSON when the Accept header is absent, a wildcard, or application/json.
 */
function contentNegotiation(rootName = 'response') {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const accept = req.headers.accept || '';
      if (accept.includes('application/xml') && !accept.includes('application/json')) {
        res.setHeader('Content-Type', 'application/xml');
        return res.send(toXml(rootName, body));
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { contentNegotiation };
