# Update Dockerfiles for all services
$services = @{
    "authentification-service" = 8087
    "client-service" = 8081
    "config-service" = 5555
    "eureka-discoveryservice" = 8761
    "factureservice" = 8083
    "gatewayservice" = 8080
    "produit-service" = 8082
    "reglement-service" = 8084
}

$dockerfileContent = @"
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
RUN apk add --no-cache wget && \
    addgroup -S spring && adduser -S spring -G spring && \
    chown -R spring:spring /app
USER spring
EXPOSE `${PORT}
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT java `${JAVA_OPTS} -jar app.jar
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider -q http://localhost:`${PORT}/actuator/health || exit 1
"@

foreach ($service in $services.Keys) {
    $port = $services[$service]
    $servicePath = Join-Path $PSScriptRoot $service
    $dockerfilePath = Join-Path $servicePath "Dockerfile"
    
    # Replace PORT placeholder with actual port
    $content = $dockerfileContent.Replace('${PORT}', $port)
    
    # Write the Dockerfile
    Set-Content -Path $dockerfilePath -Value $content -Force
    Write-Host "Updated Dockerfile for $service with port $port"
}
