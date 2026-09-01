package com.shiptrack.gateway.controller;

import com.shiptrack.common.web.ProblemDetailFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Circuit-breaker fallback: reached when a downstream service is open/unreachable/timing out.
 * Not restricted to GET — Spring Cloud Gateway's CircuitBreaker filter forwards using the
 * original request's HTTP method (POST/PATCH/DELETE included), so a GET-only mapping here would
 * itself 405 on exactly the requests it's meant to gracefully degrade.
 */
@RestController
public class FallbackController {

    @RequestMapping("/fallback/{service}")
    public ProblemDetail fallback(@PathVariable String service) {
        return ProblemDetailFactory.create(HttpStatus.SERVICE_UNAVAILABLE, "service-unavailable",
                "Service Temporarily Unavailable",
                "The '" + service + "' service is currently unavailable. The circuit breaker is open; please retry shortly.");
    }
}
