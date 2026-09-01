package com.shiptrack.common.web;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

import java.net.URI;
import java.time.Instant;

/** Builds RFC 9457 ProblemDetail responses with the fields every ShipTrack error body carries. */
public final class ProblemDetailFactory {

    private static final String TYPE_BASE = "https://shiptrack.dev/problems/";

    private ProblemDetailFactory() {
    }

    public static ProblemDetail create(HttpStatus status, String typeSlug, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setType(URI.create(TYPE_BASE + typeSlug));
        problem.setProperty("timestamp", Instant.now().toString());
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        if (correlationId != null) {
            problem.setProperty("correlationId", correlationId);
        }
        return problem;
    }
}
