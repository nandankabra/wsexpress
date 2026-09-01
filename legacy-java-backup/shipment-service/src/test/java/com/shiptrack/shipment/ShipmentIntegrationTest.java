package com.shiptrack.shipment;

import com.shiptrack.shipment.dto.ShipmentRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ShipmentIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("shipment_db")
            .withUsername("shiptrack")
            .withPassword("shiptrack");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.cloud.config.enabled", () -> "false");
        registry.add("eureka.client.enabled", () -> "false");
        registry.add("spring.kafka.bootstrap-servers", () -> "localhost:1");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl() {
        return "http://localhost:" + port + "/api/shipments";
    }

    private ShipmentRequest sampleRequest() {
        return new ShipmentRequest("Alice Sender", "1 Main St, Springfield", "Bob Receiver",
                "2 Elm St, Shelbyville", "US", "GB", 4.5);
    }

    @Test
    void create_thenGet_returnsMatchingEtagAndSupportsConditionalGet() {
        ResponseEntity<String> createResponse = restTemplate.postForEntity(baseUrl(), sampleRequest(), String.class);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String etag = createResponse.getHeaders().getETag();
        assertThat(etag).isNotBlank();

        String location = createResponse.getHeaders().getLocation().toString();

        HttpHeaders conditionalHeaders = new HttpHeaders();
        conditionalHeaders.set(HttpHeaders.IF_NONE_MATCH, etag);
        ResponseEntity<String> notModified = restTemplate.exchange(
                "http://localhost:" + port + location, HttpMethod.GET, new HttpEntity<>(conditionalHeaders), String.class);

        assertThat(notModified.getStatusCode()).isEqualTo(HttpStatus.NOT_MODIFIED);
    }

    @Test
    void create_withSameIdempotencyKeyTwice_returnsSameShipment() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Idempotency-Key", "test-key-123");
        HttpEntity<ShipmentRequest> entity = new HttpEntity<>(sampleRequest(), headers);

        ResponseEntity<String> first = restTemplate.postForEntity(baseUrl(), entity, String.class);
        ResponseEntity<String> second = restTemplate.postForEntity(baseUrl(), entity, String.class);

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(second.getBody()).isEqualTo(first.getBody());
    }

    @Test
    void patch_withoutIfMatch_returns412() {
        ResponseEntity<String> created = restTemplate.postForEntity(baseUrl(), sampleRequest(), String.class);
        String location = created.getHeaders().getLocation().toString();

        ResponseEntity<String> patchResponse = restTemplate.exchange(
                "http://localhost:" + port + location, HttpMethod.PATCH,
                new HttpEntity<>("{\"status\":\"IN_TRANSIT\"}", jsonHeaders()), String.class);

        assertThat(patchResponse.getStatusCode()).isEqualTo(HttpStatus.PRECONDITION_FAILED);
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
