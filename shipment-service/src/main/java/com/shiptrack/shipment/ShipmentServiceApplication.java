package com.shiptrack.shipment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.shiptrack.shipment", "com.shiptrack.common"})
public class ShipmentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShipmentServiceApplication.class, args);
    }
}
