# Deploy Infrastructure with Pure Bicep

## 🚀 One-Command Deployment

### Create Resource Group + Deploy Everything

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name legacy-builders-rg \
  --location southcentralus

# Deploy infrastructure
az deployment group create \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep
```

That's it! ✅

---

## 🎯 Deploy to Different Environments

### Development

```bash
az deployment group create \
  --resource-group legacy-builders-dev-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=dev
```

### Production

```bash
az deployment group create \
  --resource-group legacy-builders-prod-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=prod
```

---

## 🔍 Preview Changes (What-If)

See what will be created before deploying:

```bash
az deployment group what-if \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep
```

---

## 📊 View Outputs

After deployment, get the connection strings:

```bash
# Get all outputs
az deployment group show \
  --resource-group legacy-builders-rg \
  --name main \
  --query properties.outputs

# Get specific output
az deployment group show \
  --resource-group legacy-builders-rg \
  --name main \
  --query properties.outputs.appInsightsConnectionString.value -o tsv
```

---

## ✅ What Gets Created

**Application Insights:**
- Log Analytics Workspace
- Application Insights component

**Cosmos DB:**
- Cosmos DB account (Serverless)
- Database: LegacyBuilders
- Containers: projects, users, audit (with 30-day TTL)

**Storage:**
- Storage account
- Blob container: project-images

**No Functions/API** - That's managed by Static Web Apps!

---

## 🔧 Override Parameters

```bash
az deployment group create \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep \
  --parameters \
    environment=prod \
    projectName=legacy-builders \
    location=eastus
```

---

## 📝 Export Outputs to File

```bash
az deployment group show \
  --resource-group legacy-builders-rg \
  --name main \
  --query properties.outputs \
  > infrastructure/outputs.json
```

Then add to `.env.local`:

```bash
# Extract connection string from outputs
CONNECTION_STRING=$(jq -r '.appInsightsConnectionString.value' infrastructure/outputs.json)

# Add to .env.local
echo "VITE_APPINSIGHTS_CONNECTION_STRING=\"$CONNECTION_STRING\"" >> .env.local
```

---

## 🔄 Update Existing Deployment

Bicep is idempotent - just run the same command again:

```bash
az deployment group create \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep
```

It will:
- ✅ Create resources that don't exist
- ✅ Update resources that changed
- ✅ Leave unchanged resources alone

---

## 🗑️ Delete Everything

```bash
# Delete the entire resource group
az group delete \
  --name legacy-builders-rg \
  --yes
```

---

## 💰 Cost

All resources use **Free Tier** where available:
- Application Insights: First 5GB/month free
- Cosmos DB: Serverless (pay per request)
- Storage: Pay-as-you-go (pennies)

**Estimated monthly cost: $0-5** for low traffic

---

## 🎓 Tips

### Validate Before Deploy

```bash
az deployment group validate \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep
```

### Name Your Deployment

```bash
az deployment group create \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep \
  --name my-deployment-v1
```

### Deploy in Different Region

```bash
az deployment group create \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep \
  --parameters location=eastus
```

---

## 🔗 Resources Created

| Resource | Name Pattern | Free Tier |
|----------|-------------|-----------|
| Log Analytics | `legacy-builders-workspace-{env}` | 5GB/month |
| App Insights | `legacy-builders-insights-{env}` | 5GB/month |
| Cosmos DB | `legacy-builders-cosmos-{env}` | Serverless |
| Storage | `legacybuilders{env}storage` | Pay-as-you-go |

---

**That's it! No PowerShell, no scripts - just pure Bicep!** 🎉
