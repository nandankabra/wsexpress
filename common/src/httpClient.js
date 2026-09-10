const axios = require('axios');
const axiosRetry = require('axios-retry').default || require('axios-retry');
const CircuitBreaker = require('opossum');
const { ApiError } = require('./errors');

const DEFAULT_TIMEOUT_MS = Number(process.env.OUTBOUND_TIMEOUT_MS) || 3000;
const DEFAULT_RETRIES = Number(process.env.OUTBOUND_RETRIES) || 3;

/**
 * Creates a resilient client for calling another microservice: per-call timeout,
 * exponential-backoff retry on network/5xx errors, and a circuit breaker that trips
 * after repeated failures and short-circuits with 503 until it recovers.
 */
function createServiceClient({ baseURL, name, timeout = DEFAULT_TIMEOUT_MS, fallback } = {}) {
  const normalizedBaseURL = baseURL && !/^https?:\/\//i.test(baseURL) ? `http://${baseURL}` : baseURL;
  const instance = axios.create({ baseURL: normalizedBaseURL, timeout });

  axiosRetry(instance, {
    retries: DEFAULT_RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500),
  });

  const breaker = new CircuitBreaker(
    // Unwrap `.data` here, inside the action, so breaker.fire() always resolves to one
    // consistent shape: the response body on success, or whatever a custom fallback
    // returns on failure (e.g. `null`). Unwrapping after fire() instead (i.e. assuming
    // the resolved value is always an Axios response) breaks the moment a fallback
    // returns a plain value - `null.data` throws instead of degrading gracefully.
    async (config) => {
      const response = await instance.request(config);
      return response.data;
    },
    {
      timeout: timeout + 500,
      errorThresholdPercentage: 50,
      resetTimeout: 10_000,
      rollingCountTimeout: 10_000,
      name: name || baseURL,
    },
  );

  if (fallback) {
    breaker.fallback(fallback);
  } else {
    breaker.fallback(() => {
      throw ApiError.serviceUnavailable(`${name || baseURL} is currently unavailable`);
    });
  }

  async function request(config, correlationId) {
    const headers = { ...(config.headers || {}) };
    if (correlationId) headers['X-Correlation-Id'] = correlationId;
    return breaker.fire({ ...config, headers });
  }

  return {
    get: (url, correlationId, config = {}) => request({ ...config, method: 'GET', url }, correlationId),
    post: (url, data, correlationId, config = {}) =>
      request({ ...config, method: 'POST', url, data }, correlationId),
    put: (url, data, correlationId, config = {}) =>
      request({ ...config, method: 'PUT', url, data }, correlationId),
    patch: (url, data, correlationId, config = {}) =>
      request({ ...config, method: 'PATCH', url, data }, correlationId),
    delete: (url, correlationId, config = {}) => request({ ...config, method: 'DELETE', url }, correlationId),
    breaker,
  };
}

module.exports = { createServiceClient };
