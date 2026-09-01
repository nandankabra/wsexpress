const { ApiError } = require('./errors');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(serviceName) {
  return (err, req, res, next) => { // eslint-disable-line no-unused-vars
    const isApiError = err instanceof ApiError;
    const status = isApiError ? err.status : err.status || 500;
    const code = isApiError ? err.code : err.code || 'INTERNAL_ERROR';
    const message = status >= 500 && !isApiError ? 'Internal server error' : err.message;

    if (req.log) {
      req.log[status >= 500 ? 'error' : 'warn']({ err, status, code }, message);
    } else {
      console.error(`[${serviceName}]`, status, code, message, status >= 500 ? err.stack : '');
    }

    res.status(status).json({
      error: {
        code,
        message,
        service: serviceName,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        ...(isApiError && err.details ? { details: err.details } : {}),
      },
    });
  };
}

module.exports = { errorHandler, notFoundHandler };
