package com.shiptrack.common.exception;

/** Thrown when an If-Match / If-Unmodified-Since precondition does not hold (maps to HTTP 412). */
public class PreconditionFailedException extends RuntimeException {
    public PreconditionFailedException(String message) {
        super(message);
    }
}
