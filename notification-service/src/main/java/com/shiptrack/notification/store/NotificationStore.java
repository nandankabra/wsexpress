package com.shiptrack.notification.store;

import com.shiptrack.notification.domain.Notification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

/** In-memory, most-recent-first ring buffer of processed notifications — enough for the demo's
 *  history endpoint without introducing another datastore for a service whose real job is
 *  reacting to events, not being a system of record. */
@Component
public class NotificationStore {

    private static final int MAX_SIZE = 500;

    private final Deque<Notification> notifications = new ConcurrentLinkedDeque<>();

    public void add(Notification notification) {
        notifications.addFirst(notification);
        while (notifications.size() > MAX_SIZE) {
            notifications.removeLast();
        }
    }

    public List<Notification> recent(int limit) {
        List<Notification> snapshot = new ArrayList<>(notifications);
        return snapshot.subList(0, Math.min(limit, snapshot.size()));
    }
}
