// =============================================================================
// Legacy Builders - Complete Infrastructure (Pure Bicep)
// =============================================================================
// Deploy with:
//   rgName="${projectName}-${environment}-rg"
//   az group create --name $rgName --location <location>
//   az deployment group create --resource-group $rgName --template-file main.bicep --parameters environment=<environment>
// =============================================================================

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure region')
param location string = resourceGroup().location

@description('Project name prefix')
param projectName string = 'legacy-builders'

@description('Static Web App SKU')
@allowed(['Free', 'Standard'])
param staticWebAppSku string = environment == 'prod' ? 'Standard' : 'Free'

@description('Custom domain for production (optional)')
param customDomain string = ''

// =============================================================================
// Variables
// =============================================================================

var appInsightsName = '${projectName}-insights-${environment}'
var workspaceName = '${projectName}-workspace-${environment}'
var cosmosAccountName = '${projectName}-cosmos-${environment}'
var cosmosDatabaseName = 'LegacyBuilders'
var storageAccountName = replace('${projectName}${environment}storage', '-', '')
var staticWebAppName = '${projectName}-swa-${environment}'

// Built-in Azure RBAC role definitions
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var cosmosDbDataContributorRoleId = '00000000-0000-0000-0000-000000000002' // Cosmos DB built-in role

var tags = {
  Project: 'LegacyBuilders'
  Environment: environment
  ManagedBy: 'Bicep'
}

// =============================================================================
// Log Analytics Workspace
// =============================================================================

resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
  }
}

// =============================================================================
// Application Insights
// =============================================================================

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
  }
}

// =============================================================================
// Cosmos DB (Serverless)
// =============================================================================

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: cosmosDatabaseName
  properties: {
    resource: {
      id: cosmosDatabaseName
    }
  }
}

resource projectsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'projects'
  properties: {
    resource: {
      id: 'projects'
      partitionKey: {
        paths: ['/status']
        kind: 'Hash'
      }
    }
  }
}

resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'users'
  properties: {
    resource: {
      id: 'users'
      partitionKey: {
        paths: ['/tenantId']
        kind: 'Hash'
      }
    }
  }
}

resource auditContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'audit'
  properties: {
    resource: {
      id: 'audit'
      partitionKey: {
        paths: ['/entityType']
        kind: 'Hash'
      }
      defaultTtl: 2592000 // 30 days
    }
  }
}

// =============================================================================
// Storage Account
// =============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource projectImagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'project-images'
  properties: {
    publicAccess: 'Blob'
  }
}

// =============================================================================
// Static Web App
// =============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    repositoryUrl: 'https://github.com/jamesconsultingllc/texas-build-pros'
    branch: environment == 'prod' ? 'main' : (environment == 'staging' ? 'release' : 'develop')
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'dist'
    }
    provider: 'GitHub'
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

// Custom domain configuration (only for production with custom domain)
resource staticWebAppCustomDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = if (!empty(customDomain) && environment == 'prod') {
  parent: staticWebApp
  name: customDomain
  properties: {}
}

// Link Application Insights to Static Web App
resource staticWebAppConfig 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    CosmosDbEndpoint: cosmosAccount.properties.documentEndpoint
    CosmosDbDatabaseName: cosmosDatabaseName
    Environment: environment
  }
}

// =============================================================================
// Role Assignments (Managed Identity Access)
// =============================================================================

// Grant Static Web App managed identity access to Blob Storage
resource storageBlobDataContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, staticWebApp.id, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: staticWebApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant Static Web App managed identity access to Cosmos DB
resource cosmosDbDataContributorRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2023-04-15' = {
  parent: cosmosAccount
  name: guid(cosmosAccount.id, staticWebApp.id, cosmosDbDataContributorRoleId)
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/${cosmosDbDataContributorRoleId}'
    principalId: staticWebApp.identity.principalId
    scope: cosmosAccount.id
  }
}

// =============================================================================
// Outputs
// =============================================================================

output appInsightsConnectionString string = appInsights.properties.ConnectionString
output cosmosDbEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDbDatabaseName string = cosmosDatabaseName
output storageAccountName string = storageAccount.name
output storageBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppId string = staticWebApp.id
output staticWebAppPrincipalId string = staticWebApp.identity.principalId
