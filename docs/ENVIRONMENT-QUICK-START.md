# Environment Setup - Quick Reference

## ⚡ Fast Setup (All Environments)

### 1. Create All Infrastructure

```bash
# Production
az group create --name legacy-builders-prod-rg --location southcentralus
az deployment group create --resource-group legacy-builders-prod-rg --template-file infrastructure/main.bicep --parameters environment=prod

# Staging
az group create --name legacy-builders-staging-rg --location southcentralus
az deployment group create --resource-group legacy-builders-staging-rg --template-file infrastructure/main.bicep --parameters environment=staging

# Dev
az group create --name legacy-builders-dev-rg --location southcentralus
az deployment group create --resource-group legacy-builders-dev-rg --template-file infrastructure/main.bicep --parameters environment=dev
```

### 2. Create Static Web App

```bash
az staticwebapp create \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --source https://github.com/YOUR_USERNAME/legacy-builders \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist" \
  --location centralus
```

### 3. Create Named Environments

```bash
# Staging
az staticwebapp environment create \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name staging \
  --branch staging

# Dev
az staticwebapp environment create \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name dev \
  --branch dev
```

### 4. Get Connection Strings

```bash
# Production
az deployment group show --resource-group legacy-builders-prod-rg --name main --query properties.outputs.appInsightsConnectionString.value -o tsv

# Staging
az deployment group show --resource-group legacy-builders-staging-rg --name main --query properties.outputs.appInsightsConnectionString.value -o tsv

# Dev
az deployment group show --resource-group legacy-builders-dev-rg --name main --query properties.outputs.appInsightsConnectionString.value -o tsv
```

### 5. Configure SWA Environment Variables

```bash
# Production
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-prod.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[prod-connection-string]" \
    Environment="prod"

# Staging
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name staging \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-staging.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[staging-connection-string]" \
    Environment="staging"

# Dev
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name dev \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-dev.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[dev-connection-string]" \
    Environment="dev"
```

---

## 🎯 Environment URLs

| Environment | URL | Infrastructure |
|------------|-----|----------------|
| **Production** | `https://legacy-builders.azurestaticapps.net` | `legacy-builders-prod-rg` |
| **Staging** | `https://staging.legacy-builders.azurestaticapps.net` | `legacy-builders-staging-rg` |
| **Dev** | `https://dev.legacy-builders.azurestaticapps.net` | `legacy-builders-dev-rg` |
| **PR Preview** | `https://[random].azurestaticapps.net` | Uses dev infrastructure |

---

## 🔄 Typical Workflow

```
1. Create PR → dev branch
   └─ Preview environment created
   └─ Uses dev infrastructure

2. Merge to dev → dev environment updates
   └─ https://dev.legacy-builders.azurestaticapps.net

3. Create PR → staging branch
   └─ Preview environment created

4. Merge to staging → staging environment updates
   └─ https://staging.legacy-builders.azurestaticapps.net

5. Create PR → main branch
   └─ Preview environment created

6. Merge to main → production environment updates
   └─ https://legacy-builders.azurestaticapps.net
```

---

## 🔍 Verify Setup

```bash
# List all environments
az staticwebapp environment list \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg

# Check environment variables
az staticwebapp appsettings list \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name staging
```

---

See **[ENVIRONMENT-SETUP-GUIDE.md](./ENVIRONMENT-SETUP-GUIDE.md)** for detailed documentation.
