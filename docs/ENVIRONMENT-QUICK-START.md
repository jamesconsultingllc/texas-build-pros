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
# Static Web Apps automatically create environments from GitFlow branches
# Push to these branches to create/update environments:
# - main        → Production
# - develop     → Development
# - release/*   → Staging
# - feature/*   → Preview (per pull request)
# - hotfix/*    → Preview (per pull request)
```

### GitFlow Branch → Environment Mapping

| Branch Pattern | SWA Environment | Purpose |
|----------------|-----------------|---------|
| `main` | Production | Live customer traffic |
| `develop` | Dev | Integration testing + daily QA |
| `release/*` | Staging | Final validation before prod |
| `feature/*` | Preview (auto) | PR verification per feature |
| `hotfix/*` | Preview (auto) | Emergency fixes validated before release |

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

## 🔄 Typical GitFlow Deployment Cycle

```
1. Start a feature from develop (git flow feature start <name>)
   └─ Push to origin → preview SWA environment spins up for the PR
   └─ Uses dev infrastructure for downstream resources

2. Finish feature → merge into develop
   └─ Develop branch deployment refreshes the shared dev SWA environment

3. Cut a release branch (git flow release start <version>)
   └─ Release/* branches auto-deploy to the staging SWA environment
   └─ Perform final validation + approvals here

4. Finish release → merge to main and back-merge to develop
   └─ Main deploys to production SWA
   └─ Tags (vX.Y.Z) mark releases

5. Hotfix? Start from main (git flow hotfix start <version>)
   └─ Preview SWA spins up for PR validation
   └─ Finish hotfix to patch main + sync develop quickly
```

---

## 🔍 Verify Setup

```bash
# List all environments
az staticwebapp environment list \
  --name legacy-builders \
  --resource-group legacy-builders

# Check environment variables
az staticwebapp appsettings list \
  --name legacy-builders \
  --resource-group legacy-builders \
  --environment-name staging

az staticwebapp appsettings list \
  --name legacy-builders \
  --resource-group legacy-builders \
  --environment-name dev
```

---

## 🧭 GitFlow Commands Reference

> Install the GitFlow CLI (`git flow`) or run the equivalent manual git commands in parentheses.

```bash
# Start a new feature branch
git flow feature start my-feature        # or: git checkout -b feature/my-feature develop

# Publish the feature for collaboration (creates preview SWA env)
git push origin feature/my-feature

# Finish the feature after PR approval
git flow feature finish my-feature      # or: git checkout develop && git merge --no-ff feature/my-feature

# Start a release branch
git flow release start 1.2.0            # or: git checkout -b release/1.2.0 develop

# Finish the release (tags main + merges back to develop)
git flow release finish 1.2.0

# Emergency hotfix from production
git flow hotfix start 1.2.1             # or: git checkout -b hotfix/1.2.1 main

# Finish the hotfix to patch prod and sync develop
git flow hotfix finish 1.2.1
```

Keep `main` and `develop` protected in GitHub so merges require passing CI and at least one approval.

---

See **[ENVIRONMENT-SETUP-GUIDE.md](./ENVIRONMENT-SETUP-GUIDE.md)** for detailed documentation.
