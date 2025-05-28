# Initialize PayFlow Manager Services
Write-Host "PayFlow Manager Service Startup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to wait for service health
function Wait-ForService {
    param (
        [string]$serviceName,
        [string]$healthUrl,
        [int]$timeoutSeconds = 180,
        [int]$intervalSeconds = 5
    )
    
    Write-Host "Waiting for $serviceName to be healthy at $healthUrl..." -ForegroundColor Yellow
    $elapsed = 0
    $retries = 0
    $maxRetries = 3
    
    while ($elapsed -lt $timeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "$serviceName is healthy!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "Waiting for $serviceName to start... ($elapsed seconds)" -ForegroundColor Yellow
        }
        
        Start-Sleep -Seconds $intervalSeconds
        $elapsed += $intervalSeconds
    }
    
    Write-Host "Timeout waiting for $serviceName to be healthy!" -ForegroundColor Red
    return $false
}

# Stop any running containers and remove volumes
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker compose down -v

# Start MySQL and wait for it to be healthy
Write-Host "Starting MySQL..." -ForegroundColor Yellow
docker compose up -d mysql

# Wait for MySQL to be ready
$maxAttempts = 30
$attempt = 0
$mysqlReady = $false

while (-not $mysqlReady -and $attempt -lt $maxAttempts) {
    Write-Host "Waiting for MySQL to be ready... Attempt $($attempt + 1)/$maxAttempts"
    try {
        $result = docker compose exec -T mysql mysqladmin -uroot -proot ping
        if ($result -match "mysqld is alive") {
            $mysqlReady = $true
            Write-Host "MySQL is ready!" -ForegroundColor Green
        }
    } catch {
        Start-Sleep -Seconds 5
        $attempt++
    }
}

if (-not $mysqlReady) {
    Write-Host "MySQL failed to start properly after $maxAttempts attempts" -ForegroundColor Red
    exit 1
}

# Initialize databases
Write-Host "Initializing databases..." -ForegroundColor Yellow
Get-Content setup.sql | docker compose exec -T mysql mysql -uroot -proot

# Start services in order
$services = @(
    @{Name="Config Service"; Container="config-service"; HealthUrl="http://localhost:5555/actuator/health"},
    @{Name="Eureka Service"; Container="eureka-service"; HealthUrl="http://localhost:8761/actuator/health"},
    @{Name="Gateway Service"; Container="gateway-service"; HealthUrl="http://localhost:8080/actuator/health"},
    @{Name="Auth Service"; Container="auth-service"; HealthUrl="http://localhost:8087/actuator/health"}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name)..." -ForegroundColor Yellow
    docker compose up -d $service.Container
    
    if (-not (Wait-ForService -serviceName $service.Name -healthUrl $service.HealthUrl)) {
        Write-Host "Failed to start $($service.Name). Check the logs with: docker compose logs $($service.Container)" -ForegroundColor Red
        exit 1
    }
}

# Start business services in sequence to ensure proper initialization
Write-Host "Starting business services..." -ForegroundColor Yellow

$businessServices = @(
    @{Name="Client Service"; Container="client-service"; HealthUrl="http://localhost:8081/actuator/health"},
    @{Name="Product Service"; Container="produit-service"; HealthUrl="http://localhost:8082/actuator/health"},
    @{Name="Invoice Service"; Container="facture-service"; HealthUrl="http://localhost:8083/actuator/health"},
    @{Name="Payment Service"; Container="reglement-service"; HealthUrl="http://localhost:8084/actuator/health"}
)

foreach ($service in $businessServices) {
    Write-Host "Starting $($service.Name)..." -ForegroundColor Yellow
    docker compose up -d $service.Container
    
    if (-not (Wait-ForService -serviceName $service.Name -healthUrl $service.HealthUrl)) {
        Write-Host "Failed to start $($service.Name). Check the logs with: docker compose logs $($service.Container)" -ForegroundColor Red
        exit 1
    }
}

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
docker compose up -d frontend

Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host @"

PayFlow Manager is ready!
Access points:
- Frontend: http://localhost:4200
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761
- Config Server: http://localhost:5555

To view logs: docker compose logs -f [service-name]
To stop all services: docker compose down
"@ -ForegroundColor Cyan
