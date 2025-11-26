# Infrastructure Setup

## Prerequisites

### GitHub Secrets Required
The following secrets must be configured in GitHub (Settings → Secrets and variables → Actions):

- `AZURE_CLIENT_ID`: Azure AD App Client ID for OIDC authentication
- `AZURE_TENANT_ID`: Azure Tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure Subscription ID
- `AZURE_STATIC_WEB_APPS_API_TOKEN_MANGO_MEADOW_0DA95B810`: Static Web App deployment token

### Azure Service Principal Setup

1. Create a service principal:
```bash
az ad sp create-for-rbac \
  --name "github-actions-legacy-builders" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/legacy-builders
```

2. Configure OIDC federated credentials for the service principal for the following branches:
   - `main` (production)
   - `develop` (development)
   - `feature/*` (feature previews)
   - `release/*` (staging)
   - `hotfix/*` (hotfix previews)

See [Azure OIDC documentation](https://docs.microsoft.com/azure/active-directory/develop/workload-identity-federation-create-trust-github) for details.

## Deployment

Infrastructure is automatically deployed via GitHub Actions when pushing to protected branches.