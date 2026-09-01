function cacheControl(seconds = 60) {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${seconds}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
}

module.exports = { cacheControl };
