class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static preconditionFailed(message = 'Precondition failed') {
    return new ApiError(412, 'PRECONDITION_FAILED', message);
  }

  static unprocessable(message, details) {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  static tooManyRequests(message = 'Rate limit exceeded') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static serviceUnavailable(message = 'Upstream service unavailable') {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }

  static gatewayTimeout(message = 'Upstream service timed out') {
    return new ApiError(504, 'GATEWAY_TIMEOUT', message);
  }
}

module.exports = { ApiError };
