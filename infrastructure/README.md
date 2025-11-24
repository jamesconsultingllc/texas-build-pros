# Legacy Builders Infrastructure

Complete Azure infrastructure as code using Bicep for the Legacy Builders Investments application.

## Architecture

This Bicep template deploys a complete serverless architecture on Azure:

- **Azure Static Web Apps** (Standard tier for prod, Free tier for dev/staging)
  - System-assigned managed identity
  - Automatic GitHub integration
  - Built-in CI/CD
  - Custom domain support (production only)
- **Azure Cosmos DB** (Serverless)
  - `projects` container (partitioned by `/status`)
  - `users` container (partitioned by `/tenantId`)
  - `audit` container (partitioned by `/entityType`, 30-day TTL)
- **Azure Blob Storage** (Standard LRS)
  - `project-images` container (public blob access)
- **Application Insights** + Log Analytics
  - 90-day retention
  - Linked to Static Web App automatically

## Managed Identity & RBAC

The template automatically configures:

1. **Storage Blob Data Contributor** role for SWA managed identity
   - Allows API to upload images to blob storage without connection strings
2. **Cosmos DB Data Contributor** role for SWA managed identity
   - Allows API to read/write Cosmos DB without connection strings

## Deployment

### Prerequisites

```bash
# Install Azure CLI
az login
az account set --subscription <subscription-id>
```

### Deploy to Environment

**Production:**
```bash
az group create --name legacy-builders-prod-rg --location centralus
az deployment group create \
  --resource-group legacy-builders-prod-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=prod customDomain='www.lbinvestmentsllc.com'
```

**Staging:**
```bash
az group create --name legacy-builders-staging-rg --location centralus
az deployment group create \
  --resource-group legacy-builders-staging-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=staging
```

**Dev:**
```bash
az group create --name legacy-builders-dev-rg --location centralus
az deployment group create \
  --resource-group legacy-builders-dev-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=dev
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `environment` | string | `dev` | Environment: `dev`, `staging`, or `prod` |
| `location` | string | `resourceGroup().location` | Azure region |
| `projectName` | string | `legacy-builders` | Project name prefix |
| `staticWebAppSku` | string | `Standard` (prod), `Free` (dev/staging) | SWA SKU tier |
| `customDomain` | string | `''` | Custom domain for production (optional) |

## Outputs

After deployment, the template outputs:

```bash
# Get outputs
az deployment group show \
  --resource-group legacy-builders-prod-rg \
  --name main \
  --query properties.outputs
```

Available outputs:
- `appInsightsConnectionString` - Application Insights connection string
- `cosmosDbEndpoint` - Cosmos DB endpoint URL
- `cosmosDbDatabaseName` - Cosmos DB database name (`LegacyBuilders`)
- `storageAccountName` - Storage account name
- `storageBlobEndpoint` - Blob storage endpoint URL
- `staticWebAppName` - Static Web App resource name
- `staticWebAppDefaultHostname` - Default `.azurestaticapps.net` hostname
- `staticWebAppId` - Resource ID of the Static Web App
- `staticWebAppPrincipalId` - Managed identity principal ID

## Environment Configuration

After deployment, configure these app settings in the Static Web App:

1. **Application Insights** (auto-configured via Bicep)
   - `APPLICATIONINSIGHTS_CONNECTION_STRING`
2. **Cosmos DB** (auto-configured via Bicep)
   - `CosmosDbEndpoint`
   - `CosmosDbDatabaseName`
3. **Environment** (auto-configured via Bicep)
   - `Environment` (`prod`, `staging`, or `dev`)

## GitHub Integration

The Static Web App will automatically:
1. Create a GitHub Actions workflow in your repository
2. Deploy on push to the configured branch:
   - `main` → Production
   - `release/*` → Staging
   - `develop` → Dev
3. Create preview environments for pull requests

## Custom Domain Setup

For production with custom domain:

1. Deploy with custom domain parameter:
   ```bash
   --parameters customDomain='www.lbinvestmentsllc.com'
   ```

2. Configure DNS CNAME record:
   ```
   www.lbinvestmentsllc.com → <swa-default-hostname>
   ```

3. Wait for Azure to validate and provision SSL certificate (automatic)

## Security Best Practices

✅ **No connection strings or secrets in code**
- Managed identities for all service-to-service communication

✅ **RBAC roles with least privilege**
- Storage Blob Data Contributor (not Owner)
- Cosmos DB Data Contributor (not Account Reader Key)

✅ **TLS 1.2 minimum** enforced on all services

✅ **Public access** limited to necessary containers only

## Cost Optimization

All services use free or low-cost tiers:
- **Static Web Apps:** Free tier (dev/staging), Standard tier (prod) ~$9/month
- **Cosmos DB:** Serverless (pay-per-request, first 1000 RU/s free)
- **Application Insights:** Free tier (5GB/month ingestion)
- **Azure Functions:** Consumption plan (1M executions free/month)
- **Storage Account:** Standard LRS (5GB free, ~$0.02/GB after)

**Estimated monthly cost:**
- Dev/Staging: ~$0-5 (mostly free tier)
- Production: ~$10-30 (depends on traffic)

## Troubleshooting

### Role assignment not working?

Check that the managed identity has been created:
```bash
az staticwebapp show \
  --name legacy-builders-swa-prod \
  --resource-group legacy-builders-prod-rg \
  --query identity.principalId
```

### Cosmos DB access denied?

Verify role assignment:
```bash
az cosmosdb sql role assignment list \
  --account-name legacy-builders-cosmos-prod \
  --resource-group legacy-builders-prod-rg
```

### Storage access denied?

Verify role assignment:
```bash
az role assignment list \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage-name>
```

## Updating Existing Resources

To update an existing deployment:

```bash
az deployment group create \
  --resource-group legacy-builders-prod-rg \
  --template-file infrastructure/main.bicep \
  --parameters environment=prod customDomain='www.lbinvestmentsllc.com' \
  --mode Incremental
```

The deployment will only update changed resources.

## Cleanup

To delete all resources:

```bash
# Delete entire resource group (CAUTION: this deletes everything!)
az group delete --name legacy-builders-prod-rg --yes --no-wait
```

## References

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Cosmos DB Serverless](https://learn.microsoft.com/en-us/azure/cosmos-db/serverless)
- [Managed Identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/)
- [Bicep Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
