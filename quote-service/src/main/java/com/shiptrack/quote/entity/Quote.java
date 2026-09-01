package com.shiptrack.quote.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "quotes")
@Getter
@Setter
@NoArgsConstructor
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2)
    private String originCountryCode;

    @Column(nullable = false, length = 2)
    private String destinationCountryCode;

    @Column(nullable = false)
    private Double weightKg;

    @Column(nullable = false, length = 50)
    private String carrierName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    private Long requestedByUserId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
