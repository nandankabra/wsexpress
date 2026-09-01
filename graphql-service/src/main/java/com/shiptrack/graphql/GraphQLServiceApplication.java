package com.shiptrack.graphql;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableFeignClients
@ComponentScan(basePackages = {"com.shiptrack.graphql", "com.shiptrack.common"})
public class GraphQLServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(GraphQLServiceApplication.class, args);
    }
}
