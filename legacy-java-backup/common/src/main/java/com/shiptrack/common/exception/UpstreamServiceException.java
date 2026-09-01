package com.shiptrack.common.exception;

/** Thrown when a downstream dependency (SOAP carrier, another microservice) is unavailable, times out, or the
 *  circuit breaker is open. Maps to HTTP 503. */
public class UpstreamServiceException extends RuntimeException {
    public UpstreamServiceException(String message) {
        super(message);
    }

    public UpstreamServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
