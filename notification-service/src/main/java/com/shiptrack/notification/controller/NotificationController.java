package com.shiptrack.notification.controller;

import com.shiptrack.notification.domain.Notification;
import com.shiptrack.notification.store.NotificationStore;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "History of notifications dispatched from consumed Kafka events")
public class NotificationController {

    private final NotificationStore notificationStore;

    @GetMapping
    @Operation(summary = "Recent notifications, most recent first")
    public ResponseEntity<List<Notification>> recent(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(notificationStore.recent(limit));
    }
}
