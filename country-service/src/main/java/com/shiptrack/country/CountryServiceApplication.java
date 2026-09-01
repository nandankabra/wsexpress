package com.shiptrack.country;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.shiptrack.country", "com.shiptrack.common"})
public class CountryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CountryServiceApplication.class, args);
    }
}
