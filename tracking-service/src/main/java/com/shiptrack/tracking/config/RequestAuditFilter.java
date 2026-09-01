package com.shiptrack.tracking.config;

import com.shiptrack.common.constants.Headers;
import com.shiptrack.tracking.document.RequestAudit;
import com.shiptrack.tracking.repository.RequestAuditRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/** Persists one audit row per mutating request (POST/PATCH/DELETE) to the request_audit collection. */
@Component
@RequiredArgsConstructor
public class RequestAuditFilter extends OncePerRequestFilter {

    private static final Set<String> AUDITED_METHODS = Set.of("POST", "PATCH", "DELETE", "PUT");

    private final RequestAuditRepository requestAuditRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            if (AUDITED_METHODS.contains(request.getMethod())) {
                String correlationId = response.getHeader(Headers.CORRELATION_ID);
                requestAuditRepository.save(new RequestAudit(correlationId, request.getMethod(),
                        request.getRequestURI(), response.getStatus(), System.currentTimeMillis() - start));
            }
        }
    }
}
