package com.shiptrack.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "security")
public record SecurityProperties(List<String> publicPaths) {
}
