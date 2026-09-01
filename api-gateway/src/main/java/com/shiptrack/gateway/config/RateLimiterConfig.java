package com.shiptrack.gateway.config;

import com.shiptrack.common.constants.SecurityConstants;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    /** Rate-limit per authenticated user when present, otherwise per client IP — so one abusive
     *  anonymous caller can't starve everyone else, and one busy user can't starve other users. */
    @Bean
    public KeyResolver rateLimitKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst(SecurityConstants.HEADER_USER_ID);
            if (userId != null) {
                return Mono.just("user:" + userId);
            }
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("ip:" + ip);
        };
    }
}
