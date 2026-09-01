package com.shiptrack.notification.domain;

import java.time.Instant;

public record Notification(String id, String channel, String type, String message, Instant createdAt) {

    public static Notification of(String channel, String type, String message) {
        return new Notification(java.util.UUID.randomUUID().toString(), channel, type, message, Instant.now());
    }
}
