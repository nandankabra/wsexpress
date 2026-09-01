package com.shiptrack.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrack.common.constants.Headers;
import com.shiptrack.common.constants.SecurityConstants;
import com.shiptrack.common.web.ProblemDetailFactory;
import com.shiptrack.gateway.config.SecurityProperties;
import com.shiptrack.gateway.security.JwtSupport;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * Validates the JWT for every request that isn't explicitly public, and injects trusted
 * X-User-Id / X-User-Roles / X-User-Email headers for downstream services to consume — so
 * resource services never need to re-parse or re-verify the token themselves.
 */
@Component
public class JwtAuthenticationGlobalFilter implements GlobalFilter, Ordered {

    private final JwtSupport jwtSupport;
    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();
    private final List<String> publicPaths;

    public JwtAuthenticationGlobalFilter(JwtSupport jwtSupport, ObjectMapper objectMapper,
            SecurityProperties securityProperties) {
        this.jwtSupport = jwtSupport;
        this.objectMapper = objectMapper;
        this.publicPaths = securityProperties.publicPaths();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        String header = exchange.getRequest().getHeaders().getFirst(SecurityConstants.AUTHORIZATION_HEADER);
        if (header == null || !header.startsWith(SecurityConstants.BEARER_PREFIX)) {
            return unauthorized(exchange, "Missing bearer token");
        }

        String token = header.substring(SecurityConstants.BEARER_PREFIX.length());
        try {
            Claims claims = jwtSupport.parse(token);
            Set<String> roles = jwtSupport.roles(claims);

            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header(SecurityConstants.HEADER_USER_ID, String.valueOf(claims.get(SecurityConstants.CLAIM_USER_ID)))
                    .header(SecurityConstants.HEADER_USER_EMAIL, claims.getSubject())
                    .header(SecurityConstants.HEADER_USER_ROLES, String.join(",", roles))
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (JwtException | IllegalArgumentException ex) {
            return unauthorized(exchange, "Invalid or expired token: " + ex.getMessage());
        }
    }

    private boolean isPublic(String path) {
        return publicPaths.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String detail) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(org.springframework.http.HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        ProblemDetail problem = ProblemDetailFactory.create(HttpStatus.UNAUTHORIZED, "unauthorized",
                "Authentication Required", detail);
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(problem);
        } catch (Exception e) {
            bytes = ("{\"detail\":\"" + detail + "\"}").getBytes(StandardCharsets.UTF_8);
        }
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        response.getHeaders().add(Headers.CORRELATION_ID,
                exchange.getRequest().getHeaders().getFirst(Headers.CORRELATION_ID));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
