# Build and Run Script for PayFlow Manager Microservices
Write-Host "PayFlow Manager Build and Run Script" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Function to execute command with error handling
function Invoke-CommandWithErrorHandling {
    param(
        [string]$Command,
        [string]$ErrorMessage
    )
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "$ErrorMessage (Exit code: $LASTEXITCODE)"
        }
    }
    catch {
        Write-Host "Error: $ErrorMessage" -ForegroundColor Red
        Write-Host "Details: $_" -ForegroundColor Red
        exit 1
    }
}

# Build Spring Boot services
$services = @(
    "config-service",
    "eureka-discoveryservice",
    "authentification-service",
    "gatewayservice",
    "client-service",
    "produit-service",
    "factureservice",
    "reglement-service"
)

Write-Host "`nStep 1: Building Spring Boot Services" -ForegroundColor Green
foreach ($service in $services) {
    Write-Host "`nBuilding $service..." -ForegroundColor Yellow
    Push-Location $service
    if (Test-Path mvnw) {
        Invoke-CommandWithErrorHandling "./mvnw clean package -DskipTests" "Failed to build $service"
    } else {
        Invoke-CommandWithErrorHandling "mvn clean package -DskipTests" "Failed to build $service"
    }
    Pop-Location
}

# Build Angular frontend
Write-Host "`nStep 2: Building Angular Frontend" -ForegroundColor Green
Push-Location PayFlow_Manager
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
Invoke-CommandWithErrorHandling "npm install" "Failed to install npm dependencies"

Write-Host "Building frontend..." -ForegroundColor Yellow
Invoke-CommandWithErrorHandling "npm run build --configuration=production" "Failed to build frontend"
Pop-Location

# Build and start Docker services
Write-Host "`nStep 3: Building Docker Images" -ForegroundColor Green
Invoke-CommandWithErrorHandling "docker compose build --no-cache" "Failed to build Docker images"

Write-Host "`nStep 4: Starting Services" -ForegroundColor Green
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker compose down -v

# Start services in the correct order using the start script
./start-services.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Service startup failed! Please check the logs above." -ForegroundColor Red
    exit 1
}

Write-Host @"

PayFlow Manager is now running!
=============================
Access points:
- Frontend: http://localhost:4200
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761
- Config Server: http://localhost:5555

Useful commands:
- View all logs: docker compose logs -f
- View specific service logs: docker compose logs -f [service-name]
- Stop all services: docker compose down
- Restart a service: docker compose restart [service-name]

"@ -ForegroundColor Cyan
