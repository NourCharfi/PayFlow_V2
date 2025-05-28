Write-Host "Building all services..." -ForegroundColor Green

$services = @(
    "config-service",
    "eureka-discoveryservice",
    "gatewayservice",
    "authentification-service",
    "client-service",
    "produit-service",
    "factureservice",
    "reglement-service"
)

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    Set-Location $service
    mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build $service" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location PayFlow_Manager
npm install
npm run build --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build frontend" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "All services built successfully!" -ForegroundColor Green
