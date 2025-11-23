# Authentication & API Integration Plan with Cosmos DB

## 📋 Implementation Checklist

### Phase 1: Azure Infrastructure Setup

#### Azure Cosmos DB Configuration
- [ ] **Create Cosmos DB Account**
  - [ ] Choose SQL API for familiarity with SQL syntax
  - [ ] Configure multi-region writes (if needed for global distribution)
  - [ ] Set up preferred regions for low latency
  - [ ] Enable Point-in-time restore for backup

- [ ] **Design Data Model**
  - [ ] Create `TexasBuildPros` database
  - [ ] Create containers with appropriate partition keys:
    ```json
    // Users Container
    {
      "id": "user-guid",
      "partitionKey": "/tenantId",  // For multi-tenant support
      "email": "user@example.com",
      "roles": ["admin"],
      "profile": { /* embedded user details */ }
    }
    
    // Projects Container
    {
      "id": "project-guid",
      "partitionKey": "/category",  // High cardinality: kitchen, bathroom, outdoor, etc.
      "title": "Modern Kitchen Renovation",
      "client": "John Doe",
      "images": [/* embedded image metadata */],
      "details": { /* embedded project details */ },
      "createdBy": "userId",
      "createdAt": "2025-11-22T..."
    }
    
    // Audit Container (for tracking changes)
    {
      "id": "audit-guid",
      "partitionKey": "/entityType",  // "project", "user", etc.
      "entityId": "referenced-entity-id",
      "action": "create|update|delete",
      "performedBy": "userId",
      "timestamp": "2025-11-22T...",
      "changes": { /* change details */ }
    }
    ```

- [ ] **Local Development Setup**
  - [ ] Install [Azure Cosmos DB Emulator](https://learn.microsoft.com/azure/cosmos-db/emulator)
  - [ ] Configure emulator connection strings for local development
  - [ ] Install VS Code Extension: `ms-azuretools.vscode-cosmosdb`

#### Microsoft Entra ID (Azure AD) Setup
- [ ] **Register Application**
  - [ ] Create new app registration in Azure Portal
  - [ ] Note Application (client) ID
  - [ ] Note Directory (tenant) ID
  - [ ] Create client secret and store securely

- [ ] **Configure Authentication**
  - [ ] Add redirect URIs:
    - `http://localhost:5173/` (local development)
    - `https://YOUR-APP.azurestaticapps.net/`
    - `https://YOUR-APP.azurestaticapps.net/.auth/login/aad/callback`
  - [ ] Configure API permissions:
    - Microsoft Graph: `User.Read`
    - Add custom API scope: `api://YOUR-CLIENT-ID/access_as_user`

- [ ] **Define App Roles**
  - [ ] Create "Admin" role in app manifest
  - [ ] Create "User" role (if needed)
  - [ ] Assign roles to users in Enterprise Applications

### Phase 2: Backend API Implementation (C#)

#### API Project Setup
- [ ] **Create ASP.NET Core Web API Project**
  ```bash
  dotnet new webapi -n TexasBuildPros.Api
  cd TexasBuildPros.Api
  ```

- [ ] **Install Required NuGet Packages**
  ```bash
  dotnet add package Microsoft.Azure.Cosmos
  dotnet add package Microsoft.Identity.Web
  dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
  dotnet add package Azure.Storage.Blobs
  ```

- [ ] **Configure Authentication in Program.cs**
  ```csharp
  builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
      .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
  
  builder.Services.AddAuthorization(options =>
  {
      options.AddPolicy("AdminOnly", policy => 
          policy.RequireRole("Admin"));
  });
  ```

#### Cosmos DB Integration
- [ ] **Create Cosmos DB Service**
  ```csharp
  public interface ICosmosDbService
  {
      Task<T> GetItemAsync<T>(string id, string partitionKey);
      Task<IEnumerable<T>> GetItemsAsync<T>(string queryString);
      Task<T> CreateItemAsync<T>(T item, string partitionKey);
      Task<T> UpdateItemAsync<T>(string id, T item, string partitionKey);
      Task DeleteItemAsync(string id, string partitionKey);
  }
  ```

- [ ] **Implement Repository Pattern**
  - [ ] Create `ProjectRepository` with Cosmos DB integration
  - [ ] Create `UserRepository` for user management
  - [ ] Create `AuditRepository` for tracking changes
  - [ ] Use singleton `CosmosClient` for connection reuse

- [ ] **Create API Controllers**
  - [ ] `ProjectsController` with CRUD operations
  - [ ] `UsersController` for user management
  - [ ] `ImagesController` for image upload to Azure Blob Storage
  - [ ] Apply `[Authorize]` and `[RequireRole("Admin")]` attributes

- [ ] **Implement Error Handling**
  - [ ] Handle Cosmos DB 429 (rate limiting) with retry logic
  - [ ] Log diagnostics for performance monitoring
  - [ ] Create global exception handler middleware

### Phase 3: Frontend Integration

#### MSAL React Setup
- [ ] **Install Dependencies**
  ```bash
  npm install @azure/msal-react @azure/msal-browser
  ```

- [ ] **Create Environment Configuration**
  ```env
  VITE_AZURE_CLIENT_ID=your-client-id
  VITE_AZURE_TENANT_ID=your-tenant-id
  VITE_API_BASE_URL=http://localhost:5000/api
  VITE_AZURE_REDIRECT_URI=http://localhost:5173
  ```

- [ ] **Implement MSAL Configuration** (as shown in previous response)

- [ ] **Update AuthContext** to use MSAL

- [ ] **Create API Service Layer**
  - [ ] Implement `fetchWithAuth` helper
  - [ ] Create typed API client for projects
  - [ ] Add request/response interceptors for token management

#### Admin Pages Implementation
- [ ] **Update Admin Dashboard**
  - [ ] Display user information from MSAL
  - [ ] Show role-based UI elements
  - [ ] Add logout functionality

- [ ] **Enhance Project Management**
  - [ ] Wire up ProjectList to fetch from API
  - [ ] Implement ProjectForm with API integration
  - [ ] Add image upload to Azure Blob Storage
  - [ ] Implement optimistic UI updates

- [ ] **Add Error Handling**
  - [ ] Create error boundary components
  - [ ] Implement toast notifications for API responses
  - [ ] Add loading states with skeletons

### Phase 4: Azure Static Web App Deployment

#### Configuration Files
- [ ] **Create `staticwebapp.config.json`**
  ```json
  {
    "routes": [
      {
        "route": "/api/*",
        "allowedRoles": ["anonymous", "authenticated"]
      },
      {
        "route": "/admin/*",
        "allowedRoles": ["authenticated"]
      }
    ],
    "navigationFallback": {
      "rewrite": "/index.html",
      "exclude": ["/images/*.{png,jpg,gif}", "/api/*"]
    },
    "platform": {
      "apiRuntime": "dotnet:6.0"
    }
  }
  ```

- [ ] **Setup GitHub Actions Workflow**
  - [ ] Configure build and deploy pipeline
  - [ ] Add environment secrets for Azure credentials
  - [ ] Setup staging and production environments

#### Azure Configuration
- [ ] **Configure Application Settings**
  - [ ] Add Cosmos DB connection string
  - [ ] Add Azure AD settings
  - [ ] Add Storage Account connection string
  - [ ] Configure CORS settings

- [ ] **Setup API Management (Optional)**
  - [ ] Create APIM instance for advanced API features
  - [ ] Configure rate limiting
  - [ ] Add API versioning

### Phase 5: Testing & Monitoring

#### Testing
- [ ] **Unit Tests**
  - [ ] Test Cosmos DB repositories with emulator
  - [ ] Test authentication flows
  - [ ] Test API endpoints

- [ ] **Integration Tests**
  - [ ] Test full authentication flow
  - [ ] Test CRUD operations end-to-end
  - [ ] Test role-based access control

- [ ] **Performance Testing**
  - [ ] Monitor RU consumption in Cosmos DB
  - [ ] Optimize queries based on diagnostics
  - [ ] Test with realistic data volumes

#### Monitoring Setup
- [ ] **Application Insights**
  - [ ] Configure for both frontend and backend
  - [ ] Set up custom telemetry
  - [ ] Create dashboards for key metrics

- [ ] **Cosmos DB Monitoring**
  - [ ] Set up alerts for high RU consumption
  - [ ] Monitor partition key distribution
  - [ ] Track query performance

- [ ] **Security Monitoring**
  - [ ] Enable Azure AD sign-in logs
  - [ ] Configure security alerts
  - [ ] Regular security assessment

### Phase 6: Production Readiness

#### Security Hardening
- [ ] **Implement Security Best Practices**
  - [ ] Enable HTTPS only
  - [ ] Implement CSP headers
  - [ ] Add rate limiting
  - [ ] Sanitize all inputs

- [ ] **Data Protection**
  - [ ] Enable encryption at rest in Cosmos DB
  - [ ] Implement data retention policies
  - [ ] Setup backup and recovery procedures

#### Performance Optimization
- [ ] **Frontend Optimization**
  - [ ] Implement code splitting
  - [ ] Add service worker for caching
  - [ ] Optimize images with CDN

- [ ] **Backend Optimization**
  - [ ] Implement response caching
  - [ ] Optimize Cosmos DB queries
  - [ ] Use batch operations where possible

#### Documentation
- [ ] **Create Documentation**
  - [ ] API documentation with Swagger
  - [ ] Deployment guide
  - [ ] Admin user guide
  - [ ] Troubleshooting guide

## 🚀 Quick Start Commands

```bash
# Backend
cd api
dotnet restore
dotnet run

# Frontend
cd ../
npm install
npm run dev

# Cosmos DB Emulator (Docker)
docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```

## 📊 Success Criteria

- [ ] Admin users can successfully authenticate via Microsoft Entra ID
- [ ] Projects are stored and retrieved from Cosmos DB
- [ ] Images are uploaded to Azure Blob Storage
- [ ] Role-based access control is enforced
- [ ] API responses are under 100ms p95 latency
- [ ] Zero unauthorized access incidents
- [ ] 99.9% uptime achieved

## 📚 Additional Resources

- [Azure Cosmos DB Best Practices](https://learn.microsoft.com/azure/cosmos-db/best-practice)
- [MSAL React Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Microsoft Identity Platform](https://learn.microsoft.com/azure/active-directory/develop/)

---

*This plan provides a comprehensive roadmap for implementing authentication and API integration with Cosmos DB as your data store, following Azure best practices and ensuring a scalable, secure solution.*
