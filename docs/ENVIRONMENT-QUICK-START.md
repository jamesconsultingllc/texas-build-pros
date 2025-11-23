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

### 2. Static Web App (Already Created)

```bash
# The SWA already exists:
# Name: legacy-builders
# Resource Group: legacy-builders
# To view details:
az staticwebapp show --name legacy-builders --resource-group legacy-builders
```

### 3. Link Environments to Branches

```bash
# Static Web Apps automatically create environments from branches
# Push to these branches to create/update environments:
# - main → Production
# - staging → Staging environment
# - dev → Dev environment
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
# Production (default environment)
az staticwebapp appsettings set \
  --name legacy-builders \
  --resource-group legacy-builders \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-prod.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[prod-connection-string]" \
    Environment="prod"

# Staging
az staticwebapp appsettings set \
  --name legacy-builders \
  --resource-group legacy-builders \
  --environment-name staging \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-staging.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[staging-connection-string]" \
    Environment="staging"

# Dev
az staticwebapp appsettings set \
  --name legacy-builders \
  --resource-group legacy-builders \
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
| **Production** | `https://[default-hostname].azurestaticapps.net` | `legacy-builders-prod-rg` |
| **Staging** | `https://[default-hostname]-staging.azurestaticapps.net` | `legacy-builders-staging-rg` |
| **Dev** | `https://[default-hostname]-dev.azurestaticapps.net` | `legacy-builders-dev-rg` |
| **PR Preview** | `https://[default-hostname]-[pr-number].azurestaticapps.net` | Uses dev infrastructure |

To get your actual URLs:
```bash
az staticwebapp show --name legacy-builders --resource-group legacy-builders --query defaultHostname -o tsv
```

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
