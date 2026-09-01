package com.shiptrack.notification.service;

import com.shiptrack.notification.domain.Notification;
import com.shiptrack.notification.store.NotificationStore;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Simulates delivering a notification (email/SMS/push) by logging it and recording it in the
 * in-memory history store. Deliberately the ONLY place that knows how a notification is "sent" —
 * swapping this for a real provider (SES, Twilio, FCM) later touches exactly one class.
 */
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final NotificationStore notificationStore;

    public void dispatch(String channel, String type, String message) {
        Notification notification = Notification.of(channel, type, message);
        notificationStore.add(notification);
        log.info("[NOTIFY:{}] {} -- {}", channel, type, message);
    }
}
