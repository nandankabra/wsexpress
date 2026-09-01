package com.shiptrack.quote;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableFeignClients
@ComponentScan(basePackages = {"com.shiptrack.quote", "com.shiptrack.common"})
public class QuoteServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(QuoteServiceApplication.class, args);
    }
}
