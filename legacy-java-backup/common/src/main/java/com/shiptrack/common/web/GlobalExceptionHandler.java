package com.shiptrack.common.web;

import com.shiptrack.common.exception.ConflictException;
import com.shiptrack.common.exception.PreconditionFailedException;
import com.shiptrack.common.exception.ResourceNotFoundException;
import com.shiptrack.common.exception.UpstreamServiceException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Base RFC 9457 (Problem Details) exception mapping shared by every ShipTrack service.
 * Each service scans com.shiptrack.common so this advice is picked up automatically; a service
 * can still declare its own narrower @ExceptionHandler methods which take precedence.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ProblemDetail handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        return ProblemDetailFactory.create(HttpStatus.NOT_FOUND, "not-found", "Resource Not Found",
                "No handler for " + ex.getResourcePath());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        return ProblemDetailFactory.create(HttpStatus.NOT_FOUND, "not-found", "Resource Not Found", ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex) {
        return ProblemDetailFactory.create(HttpStatus.CONFLICT, "conflict", "Conflict", ex.getMessage());
    }

    @ExceptionHandler(PreconditionFailedException.class)
    public ProblemDetail handlePreconditionFailed(PreconditionFailedException ex) {
        return ProblemDetailFactory.create(HttpStatus.PRECONDITION_FAILED, "precondition-failed",
                "Precondition Failed", ex.getMessage());
    }

    @ExceptionHandler(UpstreamServiceException.class)
    public ProblemDetail handleUpstream(UpstreamServiceException ex) {
        log.warn("Upstream dependency failure", ex);
        return ProblemDetailFactory.create(HttpStatus.SERVICE_UNAVAILABLE, "service-unavailable",
                "Upstream Service Unavailable", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ProblemDetailFactory.create(HttpStatus.BAD_REQUEST, "validation-error", "Validation Failed", detail);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
        return ProblemDetailFactory.create(HttpStatus.BAD_REQUEST, "validation-error", "Validation Failed",
                ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        return ProblemDetailFactory.create(HttpStatus.BAD_REQUEST, "bad-request", "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        return ProblemDetailFactory.create(HttpStatus.UNAUTHORIZED, "unauthorized", "Authentication Required",
                ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        return ProblemDetailFactory.create(HttpStatus.FORBIDDEN, "forbidden", "Access Denied", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ProblemDetailFactory.create(HttpStatus.INTERNAL_SERVER_ERROR, "internal-error",
                "Internal Server Error", "An unexpected error occurred");
    }
}
