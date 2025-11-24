// =============================================================================
// Legacy Builders - Infrastructure Only (Uses Existing SWA)
// =============================================================================
// This template creates infrastructure resources and grants permissions to
// an existing Static Web App's managed identity.
//
// Deploy with:
//   rgName="legacy-builders-${environment}-rg"
//   az group create --name $rgName --location southcentralus
//   az deployment group create --resource-group $rgName --template-file main.bicep --parameters environment=<environment>
// =============================================================================

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure region')
param location string = resourceGroup().location

@description('Project name prefix')
param projectName string = 'legacy-builders'

@description('Existing Static Web App name')
param existingStaticWebAppName string = 'legacy-builders'

@description('Existing Static Web App resource group')
param existingStaticWebAppResourceGroup string = 'legacy-builders'

// =============================================================================
// Variables
// =============================================================================

var appInsightsName = '${projectName}-insights-${environment}'
var workspaceName = '${projectName}-workspace-${environment}'
var cosmosAccountName = '${projectName}-cosmos-${environment}'
var cosmosDatabaseName = 'LegacyBuilders'
var storageAccountName = replace('${projectName}${environment}st', '-', '')

// Built-in Azure RBAC role definitions
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var cosmosDbDataContributorRoleId = '00000000-0000-0000-0000-000000000002' // Cosmos DB built-in role

var tags = {
  Project: 'LegacyBuilders'
  Environment: environment
  ManagedBy: 'Bicep'
  StaticWebApp: existingStaticWebAppName
}

// =============================================================================
// Reference Existing Static Web App
// =============================================================================

resource existingStaticWebApp 'Microsoft.Web/staticSites@2023-01-01' existing = {
  name: existingStaticWebAppName
  scope: resourceGroup(existingStaticWebAppResourceGroup)
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

// Projects container - partitioned by status for efficient filtering
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
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Users container - partitioned by tenantId for multi-tenant isolation
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
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Audit container - partitioned by entityType with TTL for compliance
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
      defaultTtl: 2592000 // 30 days TTL for audit logs
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
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

// Project images container with public blob access for CDN-like performance
resource projectImagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'project-images'
  properties: {
    publicAccess: 'Blob' // Allow public read access to images
  }
}

// =============================================================================
// Role Assignments (Using Existing SWA's Managed Identity)
// =============================================================================

// Grant existing SWA managed identity access to Blob Storage
resource storageBlobDataContributorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, existingStaticWebApp.id, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: existingStaticWebApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant existing SWA managed identity access to Cosmos DB
resource cosmosDbDataContributorRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2023-04-15' = {
  parent: cosmosAccount
  name: guid(cosmosAccount.id, existingStaticWebApp.id, cosmosDbDataContributorRoleId)
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/${cosmosDbDataContributorRoleId}'
    principalId: existingStaticWebApp.identity.principalId
    scope: cosmosAccount.id
  }
}

// =============================================================================
// Outputs
// =============================================================================

output appInsightsConnectionString string = appInsights.properties.ConnectionString
output appInsightsName string = appInsights.name
output cosmosDbEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDbDatabaseName string = cosmosDatabaseName
output cosmosDbAccountName string = cosmosAccount.name
output storageAccountName string = storageAccount.name
output storageBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output workspaceName string = workspace.name
output environment string = environment

// Instructions for next steps
output nextSteps string = '''
Next steps:
1. Update Static Web App configuration settings for this environment:
   - APPLICATIONINSIGHTS_CONNECTION_STRING (from appInsightsConnectionString output)
   - CosmosDbEndpoint (from cosmosDbEndpoint output)
   - CosmosDbDatabaseName (from cosmosDbDatabaseName output)
   - StorageAccountName (from storageAccountName output)
   - Environment (from environment output)

2. Configure environment-specific settings in your Static Web App:
   - For staging/dev: Create branch policies or staging slots
   - For production: Verify custom domain configuration

3. The existing SWA managed identity now has access to:
   - Cosmos DB: ${cosmosAccountName} (Data Contributor role)
   - Storage: ${storageAccountName} (Blob Data Contributor role)
'''
