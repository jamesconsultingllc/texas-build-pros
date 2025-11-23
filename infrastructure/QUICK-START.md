# Quick Deploy - Bicep

## ⚡ Fastest Deployment

```bash
# 1. Login
az login

# 2. Create resource group
az group create --name legacy-builders-rg --location southcentralus

# 3. Deploy everything
az deployment group create \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep
```

**Done!** ✅

---

## 📋 Common Commands

### Preview Changes
```bash
az deployment group what-if \
  --resource-group legacy-builders-rg \
  --template-file infrastructure/main.bicep
```

### Get Connection String
```bash
az deployment group show \
  --resource-group legacy-builders-rg \
  --name main \
  --query properties.outputs.appInsightsConnectionString.value -o tsv
```

### Deploy Production
```bash
az deployment group create \
  --resource-group legacy-builders-prod-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=prod
```

### Delete Everything
```bash
az group delete --name legacy-builders-rg --yes
```

---

## 🎯 What You Get

- ✅ Application Insights (with workspace)
- ✅ Cosmos DB Serverless (3 containers)
- ✅ Storage Account (with blob container)
- ✅ All configured and ready

**No API/Functions** - Static Web Apps handles that!

---

See `README.md` for full documentation.
