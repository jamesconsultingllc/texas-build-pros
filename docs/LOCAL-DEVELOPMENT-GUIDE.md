# Local Development Guide

Complete guide for running the Legacy Builders application locally with full-stack development.

## Quick Start (Recommended)

### Just Run This:

```bash
npm run swa:start
```

**That's it!** The Azure Static Web Apps CLI starts both frontend and API together.

- **Frontend + API:** http://localhost:4280
- **No CORS issues**
- **Production-like environment**
- **Automatic API integration**

### First Time Setup

If you don't have SWA CLI installed:

```bash
# Install SWA CLI globally (one time only)
npm install -g @azure/static-web-apps-cli

# Install project dependencies
npm install

# Start everything
npm run swa:start
```

---

## Alternative Methods (Advanced)

### Option 1: Frontend Only (UI Development)

```bash
npm run dev
```

Frontend at: **http://localhost:8080**

**Note:** API calls will fail. Use this only for UI/CSS work.

### Option 2: Separate Terminals (API Debugging)

**Terminal 1 - Start API:**
```bash
cd api
func start
```
API at: **http://localhost:7071**

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```
Frontend at: **http://localhost:8080**

**Why:** Useful when debugging API with breakpoints or detailed logging.

## Prerequisites

### Required

1. **Node.js** (v18 or later)
   ```bash
   node --version  # Should be v18+
   ```

2. **Azure Functions Core Tools** (v4)
   ```bash
   # Windows (via npm)
   npm install -g azure-functions-core-tools@4

   # macOS
   brew tap azure/functions
   brew install azure-functions-core-tools@4

   # Linux
   # See: https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local
   ```

   Verify installation:
   ```bash
   func --version  # Should be 4.x
   ```

3. **.NET 8 SDK**
   ```bash
   # Download from: https://dotnet.microsoft.com/download/dotnet/8.0

   # Verify installation
   dotnet --version  # Should be 8.x
   ```

### Optional (for database functionality)

4. **Azure Cosmos DB Emulator**

   **Windows:**
   - Download: [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator)
   - Install and start the emulator
   - Available at: `https://localhost:8081`

   **Docker (Linux/macOS/Windows):**
   ```bash
   docker run -p 8081:8081 -p 10251-10254:10251-10254 \
     --name cosmosdb-emulator \
     mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
   ```

## Configuration

### 1. Frontend Configuration

Create `.env.local` in the project root (this file is git-ignored):

```env
# Application Insights (optional for local dev)
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=...
```

**Get your App Insights connection string:**
```bash
# Dev environment
az monitor app-insights component show \
  --resource-group legacy-builders-dev-rg \
  --app legacy-builders-dev-insights \
  --query connectionString -o tsv
```

### 2. API Configuration

The API configuration is already set in `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "CosmosDbConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    "CosmosDbDatabaseName": "LegacyBuilders",
    "CosmosDbContainerName": "projects",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": ""
  }
}
```

**To enable telemetry locally**, add your App Insights connection string:
```json
"APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=xxx;IngestionEndpoint=..."
```

## How Local Development Works

### Vite Proxy Configuration

The frontend (Vite) is configured to proxy API requests to the Azure Functions runtime:

**vite.config.ts:**
```typescript
server: {
  port: 8080,
  proxy: {
    '/api': {
      target: 'http://localhost:7071',  // Azure Functions
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**What this means:**
- Frontend runs on `http://localhost:8080`
- API runs on `http://localhost:7071`
- When frontend calls `/api/admin/dashboard`, Vite proxies it to `http://localhost:7071/api/admin/dashboard`
- **No CORS errors!** (same-origin from browser perspective)

### CORS Configuration (Backup)

The API also has CORS configured for direct access:

**api/Program.cs:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8080",
                "http://127.0.0.1:8080",
                "https://*.azurestaticapps.net"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
```

This allows direct API calls if needed (e.g., testing with Postman, curl).

## Application Insights in Local Development

### Does It Work Locally?

**Yes!** Application Insights works in local development and sends telemetry to Azure.

### How It Works

1. **Frontend (`src/lib/telemetry.ts`):**
   - Reads `VITE_APPINSIGHTS_CONNECTION_STRING` from `.env.local`
   - Sends telemetry directly to Azure Application Insights
   - Tracks page views, errors, custom events

2. **Backend (`api/Program.cs`):**
   - Reads `APPLICATIONINSIGHTS_CONNECTION_STRING` from `local.settings.json`
   - Sends telemetry directly to Azure Application Insights
   - Tracks HTTP requests, dependencies, exceptions, custom metrics

3. **End-to-End Tracing:**
   - W3C distributed tracing headers (`traceparent`) are automatically sent
   - Frontend and backend telemetry is correlated with the same `operation_Id`
   - View complete request flows in Azure Portal

### Viewing Local Telemetry

1. **Azure Portal:**
   - Go to **Application Insights** > **Live Metrics**
   - See real-time telemetry from your local dev environment

2. **Console Logs:**
   - Frontend: Check browser console for telemetry confirmation
   - Backend: Check terminal output for telemetry logs

### Disabling Telemetry Locally

If you want to disable telemetry during development:

**.env.local:**
```env
# Comment out or remove this line
# VITE_APPINSIGHTS_CONNECTION_STRING=...
```

**api/local.settings.json:**
```json
"APPLICATIONINSIGHTS_CONNECTION_STRING": ""
```

## Development Workflows

### Typical Development Session

```bash
# 1. Start Cosmos DB Emulator (if using database features)
docker start cosmosdb-emulator  # Or start Windows emulator

# 2. Terminal 1 - Start API
cd api
func start

# 3. Terminal 2 - Start Frontend
npm run dev

# 4. Open browser
# http://localhost:8080
```

### Hot Reload

- **Frontend:** Vite hot-reloads automatically on file changes
- **API:** Azure Functions Core Tools reloads on `.cs` file changes (may take a few seconds)

### Testing API Endpoints

#### Using Browser DevTools

```javascript
// Open browser console at http://localhost:8080

// Test dashboard endpoint
fetch('/api/admin/dashboard')
  .then(r => r.json())
  .then(console.log);
```

#### Using curl

```bash
# Direct API access (CORS enabled)
curl http://localhost:7071/api/admin/dashboard

# Via Vite proxy (same as browser)
curl http://localhost:8080/api/admin/dashboard
```

#### Using REST Client (VS Code Extension)

Create `test.http`:
```http
### Get Dashboard Stats
GET http://localhost:7071/api/admin/dashboard

### Get Projects
GET http://localhost:7071/api/projects?status=published
```

## Troubleshooting

### CORS Errors

**Symptom:** `Access to fetch at 'http://localhost:7071/api/...' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Solution:**
1. Make sure you're using the Vite proxy (start frontend with `npm run dev`)
2. Verify `vite.config.ts` has the proxy configuration
3. Restart Vite dev server: `Ctrl+C`, then `npm run dev`

**Why it happens:**
- Direct browser requests from `localhost:8080` to `localhost:7071` are cross-origin
- The Vite proxy makes them same-origin

### API Not Starting

**Symptom:** `func start` fails or API not responding

**Common issues:**

1. **Port already in use:**
   ```bash
   # Check what's using port 7071
   netstat -ano | findstr :7071  # Windows
   lsof -i :7071                 # macOS/Linux

   # Kill the process or use different port
   func start --port 7072
   ```

2. **Missing .NET SDK:**
   ```bash
   dotnet --version
   # If not found, install .NET 8 SDK
   ```

3. **Missing dependencies:**
   ```bash
   cd api
   dotnet restore
   dotnet build
   func start
   ```

### Cosmos DB Connection Issues

**Symptom:** API throws exceptions about Cosmos DB connection

**Solutions:**

1. **Verify Cosmos DB Emulator is running:**
   ```bash
   curl -k https://localhost:8081/_explorer/index.html
   ```

2. **Check connection string in `api/local.settings.json`:**
   ```json
   "CosmosDbConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
   ```

3. **Create database and container:**
   - Open Data Explorer: `https://localhost:8081/_explorer/index.html`
   - Create database: `LegacyBuilders`
   - Create container: `projects` with partition key `/status`

### Application Insights Not Working

**Symptom:** No telemetry showing in Azure Portal

**Checklist:**

1. **Verify connection string is set:**
   ```bash
   # Frontend
   cat .env.local | grep VITE_APPINSIGHTS_CONNECTION_STRING

   # Backend
   cat api/local.settings.json | grep APPLICATIONINSIGHTS_CONNECTION_STRING
   ```

2. **Check Azure Portal:**
   - Go to **Application Insights** > **Live Metrics**
   - Data may take 2-3 minutes to appear
   - Check **Transaction Search** for historical data

3. **Check console for errors:**
   - Frontend: Browser DevTools console
   - Backend: Terminal running `func start`

### Frontend Can't Connect to API

**Symptom:** API calls return 404 or connection refused

**Solutions:**

1. **Verify API is running:**
   ```bash
   curl http://localhost:7071/api/admin/dashboard
   ```

2. **Check Vite proxy configuration:**
   - Open `vite.config.ts`
   - Verify proxy target is `http://localhost:7071`

3. **Restart both servers:**
   ```bash
   # Terminal 1
   cd api
   func start

   # Terminal 2
   npm run dev
   ```

### Hot Reload Not Working

**Frontend:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Backend:**
```bash
# Clean and rebuild
cd api
dotnet clean
dotnet build
func start
```

## Performance Tips

### Speed Up API Startup

1. **Use `--useHttps false` flag:**
   ```bash
   func start --useHttps false
   ```

2. **Disable Application Insights locally:**
   - Remove connection string from `local.settings.json`

### Reduce Frontend Build Time

1. **Use `npm run dev` instead of `npm run build`**
   - Vite dev server is faster than production builds

2. **Disable source maps in development:**
   ```typescript
   // vite.config.ts
   build: {
     sourcemap: false,
   }
   ```

## Best Practices

### 1. Use Separate Terminals

Keep API and frontend in separate terminal windows for easier debugging.

### 2. Check Logs Regularly

- **Frontend:** Browser DevTools Console (F12)
- **Backend:** Terminal output from `func start`
- **Application Insights:** Azure Portal > Live Metrics

### 3. Test End-to-End Flows

Before committing, test:
- Frontend loads without errors
- API endpoints respond correctly
- Data flows from frontend → API → Cosmos DB
- Errors are handled gracefully

### 4. Use Git Branches

```bash
# Create feature branch
git checkout -b feature/my-feature

# Work on your feature
# ...

# Test locally before pushing
npm run build  # Verify frontend builds
cd api && dotnet build  # Verify API builds
```

### 5. Monitor Application Insights

Even in local dev, monitor:
- Request durations
- Exception rates
- Cosmos DB RU consumption

This helps catch performance issues early!

## Additional Resources

- **Azure Functions Local Development:** https://learn.microsoft.com/en-us/azure/azure-functions/functions-develop-local
- **Vite Proxy Configuration:** https://vitejs.dev/config/server-options.html#server-proxy
- **Cosmos DB Emulator:** https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator
- **Application Insights Local Testing:** https://learn.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics

## Summary

### Recommended: Use SWA CLI (One Command)

```bash
npm run swa:start
```

Open: **http://localhost:4280**

### Alternative: Separate Terminals (For Debugging)

```bash
# Terminal 1: Start API
cd api && func start

# Terminal 2: Start Frontend
npm run dev
```

Open: **http://localhost:8080**

---

**Application Insights** works in both modes and sends telemetry to Azure, allowing you to monitor your local development environment in real-time. No CORS errors with either approach!
