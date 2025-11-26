param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev','staging','prod')]
    [string]$Environment
)

$rgName = "legacy-builders-$Environment-rg"
$swaName = "legacy-builders"
$swaRg = "legacy-builders"

# Create resource group
Write-Host "Creating resource group: $rgName" -ForegroundColor Green
az group create --name $rgName --location southcentralus

# Deploy infrastructure
Write-Host "Deploying infrastructure..." -ForegroundColor Green
$deployment = az deployment group create `
    --resource-group $rgName `
    --template-file main.bicep `
    --parameters environment=$Environment `
    --query 'properties.outputs' | ConvertFrom-Json

# Configure Static Web App
Write-Host "Configuring Static Web App..." -ForegroundColor Green

if ($Environment -eq 'prod') {
    # Production - no environment name parameter
    az staticwebapp appsettings set `
        --name $swaName `
        --resource-group $swaRg `
        --setting-names `
            APPLICATIONINSIGHTS_CONNECTION_STRING="$($deployment.appInsightsConnectionString.value)" `
            CosmosDbEndpoint="$($deployment.cosmosDbEndpoint.value)" `
            CosmosDbDatabaseName="$($deployment.cosmosDbDatabaseName.value)" `
            StorageAccountName="$($deployment.storageAccountName.value)" `
            StorageBlobEndpoint="$($deployment.storageBlobEndpoint.value)" `
            Environment="$Environment"
} else {
    # Dev/Staging - include environment name
    $swaEnvironmentName = if ($Environment -eq 'dev') { 'development' } else { 'staging' }
    az staticwebapp appsettings set `
        --name $swaName `
        --resource-group $swaRg `
        --environment-name $swaEnvironmentName `
        --setting-names `
            APPLICATIONINSIGHTS_CONNECTION_STRING="$($deployment.appInsightsConnectionString.value)" `
            CosmosDbEndpoint="$($deployment.cosmosDbEndpoint.value)" `
            CosmosDbDatabaseName="$($deployment.cosmosDbDatabaseName.value)" `
            StorageAccountName="$($deployment.storageAccountName.value)" `
            StorageBlobEndpoint="$($deployment.storageBlobEndpoint.value)" `
            Environment="$Environment"
}

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Configured $Environment environment with infrastructure" -ForegroundColor Yellow