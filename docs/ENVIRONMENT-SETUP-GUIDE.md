# Azure Static Web Apps - Environment Coordination Guide

## 🎯 Overview

Azure Static Web Apps (SWA) has its own environment system that needs to be coordinated with your infrastructure environments (Cosmos DB, Storage, App Insights).

---

## 🏗️ Architecture

```
GitHub Repository (legacy-builders)
│
├─ main branch          → Production SWA Environment
│                         ├─ Uses: legacy-builders-prod-rg
│                         ├─ Cosmos: legacy-builders-cosmos-prod
│                         └─ Storage: legacybuildersprodstorage
│
├─ staging branch       → Staging SWA Environment (Named)
│                         ├─ Uses: legacy-builders-staging-rg
│                         ├─ Cosmos: legacy-builders-cosmos-staging
│                         └─ Storage: legacybuilderstagingstorage
│
├─ dev branch           → Dev SWA Environment (Named)
│                         ├─ Uses: legacy-builders-dev-rg
│                         ├─ Cosmos: legacy-builders-cosmos-dev
│                         └─ Storage: legacybuildersdevstorage
│
└─ Pull Requests        → Preview Environments (Ephemeral)
                          └─ Uses: dev or staging infrastructure
```

---

## 📋 Static Web Apps Environment Types

### 1. Production Environment

**Branch:** `main` or `master`  
**URL:** `https://[your-app].azurestaticapps.net`  
**Created:** Automatically when you create SWA  
**Lifecycle:** Permanent

### 2. Named Environments (Staging/Dev)

**Branch:** Any named branch (e.g., `staging`, `dev`)  
**URL:** `https://[env-name].[your-app].azurestaticapps.net`  
**Created:** Manually via Azure Portal or CLI  
**Lifecycle:** Permanent until deleted

### 3. Preview Environments

**Branch:** Pull requests  
**URL:** `https://[random].[your-app].azurestaticapps.net`  
**Created:** Automatically for each PR  
**Lifecycle:** Deleted when PR closes

---

## 🚀 Setup Guide

### Step 1: Create Infrastructure for Each Environment

Create separate Azure resources for each environment:

#### Production Environment

```bash
# Create resource group
az group create \
  --name legacy-builders-prod-rg \
  --location southcentralus

# Deploy infrastructure
az deployment group create \
  --resource-group legacy-builders-prod-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=prod
```

#### Staging Environment

```bash
az group create \
  --name legacy-builders-staging-rg \
  --location southcentralus

az deployment group create \
  --resource-group legacy-builders-staging-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=staging
```

#### Dev Environment

```bash
az group create \
  --name legacy-builders-dev-rg \
  --location southcentralus

az deployment group create \
  --resource-group legacy-builders-dev-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=dev
```

---

### Step 2: Create Static Web App

```bash
# Create Static Web App (connected to GitHub)
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

**Note:** Static Web Apps not available in `southcentralus` - use `centralus` or `eastus2`

---

### Step 3: Create Named Environments

#### Create Staging Environment

```bash
az staticwebapp environment create \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name staging \
  --branch staging
```

#### Create Dev Environment

```bash
az staticwebapp environment create \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name dev \
  --branch dev
```

---

### Step 4: Configure Environment Variables

Each SWA environment needs its own connection strings pointing to its corresponding infrastructure.

**IMPORTANT:** You must include `StorageAccountConnectionString` for image upload functionality. Get the storage connection string:

```bash
# Get storage account connection string for each environment
az storage account show-connection-string --resource-group legacy-builders-prod-rg --name legacybuildersprodst --query connectionString -o tsv
az storage account show-connection-string --resource-group legacy-builders-staging-rg --name legacybuildersstagingst --query connectionString -o tsv
az storage account show-connection-string --resource-group legacy-builders-dev-rg --name legacybuildersdevst --query connectionString -o tsv
```

#### Production Environment Variables

```bash
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-prod.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    StorageAccountConnectionString="[from connection string command above]" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[from deployment outputs]" \
    Environment="prod"
```

#### Staging Environment Variables

```bash
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name staging \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-staging.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    StorageAccountConnectionString="[from connection string command above]" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[staging connection string]" \
    Environment="staging"
```

#### Dev Environment Variables

**Note:** Preview environments (feature/*, hotfix/*) automatically inherit these settings via GitHub Actions.

```bash
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name development \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-dev.documents.azure.com:443/" \
    CosmosDbDatabaseName="LegacyBuilders" \
    StorageAccountConnectionString="[from connection string command above]" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="[dev connection string]" \
    Environment="dev"
```

---

## 🔐 Managed Identity Setup

After SWA is deployed, configure Managed Identity for secure access to Azure resources.

```bash
# Enable System-Assigned Managed Identity
az staticwebapp identity assign \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg

# Get the Principal ID
PRINCIPAL_ID=$(az staticwebapp identity show \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --query principalId -o tsv)

# Grant Cosmos DB access (repeat for each environment)
az cosmosdb sql role assignment create \
  --account-name legacy-builders-cosmos-prod \
  --resource-group legacy-builders-prod-rg \
  --role-definition-id 00000000-0000-0000-0000-000000000002 \
  --principal-id $PRINCIPAL_ID \
  --scope "/subscriptions/[SUB_ID]/resourceGroups/legacy-builders-prod-rg/providers/Microsoft.DocumentDB/databaseAccounts/legacy-builders-cosmos-prod"

# Grant Storage access
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/[SUB_ID]/resourceGroups/legacy-builders-prod-rg/providers/Microsoft.Storage/storageAccounts/legacybuildersprodstorage"
```

**Repeat for staging and dev environments.**

---

## 📊 Environment Mapping

| GitHub Branch | SWA Environment | Azure Resource Group | Cosmos DB | Storage Account |
|--------------|----------------|---------------------|-----------|-----------------|
| `main` | Production | `legacy-builders-prod-rg` | `legacy-builders-cosmos-prod` | `legacybuildersprodstorage` |
| `staging` | Staging (Named) | `legacy-builders-staging-rg` | `legacy-builders-cosmos-staging` | `legacybuildersstagingstorage` |
| `dev` | Dev (Named) | `legacy-builders-dev-rg` | `legacy-builders-cosmos-dev` | `legacybuildersdevstorage` |
| `pr-*` | Preview (Ephemeral) | Uses `dev` infrastructure | `legacy-builders-cosmos-dev` | `legacybuildersdevstorage` |

---

## 🔄 Workflow

### Typical Development Flow

```
1. Developer creates feature branch from dev
   ↓
2. Developer pushes to GitHub
   ↓
3. Opens PR to dev branch
   ↓
4. SWA creates Preview Environment
   ├─ URL: https://[random].azurestaticapps.net
   └─ Uses: dev infrastructure (Cosmos Dev, Storage Dev)
   ↓
5. Review and test in Preview Environment
   ↓
6. Merge PR → deploys to dev branch
   ↓
7. Dev environment updates
   ├─ URL: https://dev.legacy-builders.azurestaticapps.net
   └─ Uses: dev infrastructure
   ↓
8. When ready, create PR: dev → staging
   ↓
9. Merge → deploys to staging
   ├─ URL: https://staging.legacy-builders.azurestaticapps.net
   └─ Uses: staging infrastructure
   ↓
10. Final testing in staging
    ↓
11. Create PR: staging → main
    ↓
12. Merge → deploys to production
    ├─ URL: https://legacy-builders.azurestaticapps.net
    └─ Uses: production infrastructure
```

---

## 💰 Cost Optimization

### Preview Environments

**Problem:** Each PR creates a preview environment that uses shared infrastructure.

**Solution:** Configure preview environments to use dev infrastructure:

```bash
# All preview environments automatically use the "production" SWA's configuration
# But you can set different env variables that point to dev infrastructure
# This happens automatically if you don't create separate configs
```

### Environment Cleanup

```bash
# List all environments
az staticwebapp environment list \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg

# Delete preview environment (done automatically when PR closes)
az staticwebapp environment delete \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name [preview-name]
```

---

## 🎯 Best Practices

### 1. Separate Infrastructure Per Environment
✅ **Do:** Create separate Cosmos DB, Storage, App Insights for prod/staging/dev  
❌ **Don't:** Share production database with dev/staging

### 2. Use Managed Identity in Production
✅ **Do:** Use Managed Identity for secure, credential-free access  
❌ **Don't:** Use connection strings in production

### 3. Preview Environments Use Dev
✅ **Do:** Point PR previews to dev infrastructure  
❌ **Don't:** Create new infrastructure for each PR

### 4. Tag Everything
✅ **Do:** Tag all resources with `Environment` tag  
❌ **Don't:** Mix resources without clear labels

### 5. Use Environment-Specific Config
✅ **Do:** Set different CORS, logging levels per environment  
❌ **Don't:** Use same config for all environments

---

## 🔍 Verify Configuration

### Check SWA Environments

```bash
# List all environments
az staticwebapp environment list \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --output table

# Show environment settings
az staticwebapp appsettings list \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name staging
```

### Test Environment Variables

In your API code:

```csharp
var environment = Environment.GetEnvironmentVariable("Environment");
var cosmosEndpoint = Environment.GetEnvironmentVariable("CosmosDbEndpoint");

_logger.LogInformation($"Running in {environment} environment");
_logger.LogInformation($"Using Cosmos: {cosmosEndpoint}");
```

---

## 🚨 Common Issues

### Issue 1: Preview Environments Using Wrong Database

**Problem:** PR previews connecting to production database

**Solution:** Set environment variables at the production SWA level that default to dev:

```bash
# Set default (used by previews) to point to dev
az staticwebapp appsettings set \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --setting-names \
    CosmosDbEndpoint="https://legacy-builders-cosmos-dev.documents.azure.com:443/"
```

### Issue 2: Named Environment Not Creating

**Problem:** Branch exists but environment not showing

**Solution:** Create environment explicitly:

```bash
az staticwebapp environment create \
  --name legacy-builders-swa \
  --resource-group legacy-builders-prod-rg \
  --environment-name [branch-name] \
  --branch [branch-name]
```

### Issue 3: Managed Identity Not Working

**Problem:** 403 errors accessing Cosmos DB

**Solution:** Check role assignments:

```bash
# Verify role assignment exists
az role assignment list \
  --assignee $PRINCIPAL_ID \
  --all \
  --output table
```

---

## 📚 Reference

- [Azure Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Environment Configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/environment-variables)
- [Managed Identity](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization)
- [Named Environments](https://learn.microsoft.com/en-us/azure/static-web-apps/named-environments)

---

## 🎓 Summary

1. **Create infrastructure** for each environment (prod, staging, dev)
2. **Create SWA** connected to GitHub
3. **Create named environments** for staging and dev branches
4. **Configure environment variables** to point each SWA environment to its infrastructure
5. **Enable Managed Identity** for secure access
6. **Test the flow** by creating a PR and checking preview environment

---

**Your environments are now properly coordinated!** 🎉
