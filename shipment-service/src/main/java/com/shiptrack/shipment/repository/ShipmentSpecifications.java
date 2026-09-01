package com.shiptrack.shipment.repository;

import com.shiptrack.shipment.entity.Shipment;
import com.shiptrack.shipment.entity.ShipmentStatus;
import org.springframework.data.jpa.domain.Specification;

public final class ShipmentSpecifications {

    private ShipmentSpecifications() {
    }

    public static Specification<Shipment> hasStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        ShipmentStatus parsed = ShipmentStatus.valueOf(status.toUpperCase());
        return (root, query, cb) -> cb.equal(root.get("status"), parsed);
    }

    public static Specification<Shipment> hasDestination(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("destinationCountryCode"), countryCode.toUpperCase());
    }

    public static Specification<Shipment> trackingNumberContains(String fragment) {
        if (fragment == null || fragment.isBlank()) {
            return null;
        }
        return (root, query, cb) -> cb.like(cb.upper(root.get("trackingNumber")), "%" + fragment.toUpperCase() + "%");
    }

    @SafeVarargs
    public static Specification<Shipment> combine(Specification<Shipment>... specs) {
        Specification<Shipment> result = Specification.where(null);
        for (Specification<Shipment> spec : specs) {
            if (spec != null) {
                result = result.and(spec);
            }
        }
        return result;
    }
}
