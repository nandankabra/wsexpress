# syntax=docker/dockerfile:1.7
# ---- Build stage: compiles the whole reactor, packages just this service ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY common common
COPY discovery-server discovery-server
COPY config-server config-server
COPY api-gateway api-gateway
COPY auth-service auth-service
COPY shipment-service shipment-service
COPY tracking-service tracking-service
COPY quote-service quote-service
COPY country-service country-service
COPY graphql-service graphql-service
COPY notification-service notification-service
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -q -B -N install \
 && mvn -q -B -pl common install -DskipTests \
 && mvn -q -B -pl config-server -am package -DskipTests

# ---- Runtime stage: slim JRE only ----
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S shiptrack && adduser -S shiptrack -G shiptrack
WORKDIR /app
COPY --from=build /workspace/config-server/target/config-server.jar app.jar
RUN chown shiptrack:shiptrack app.jar
USER shiptrack
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]
