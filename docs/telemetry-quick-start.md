# Quick Start: Enable Telemetry

## 🚀 Get telemetry working in 5 minutes

### Step 1: Install Package

```bash
npm install @microsoft/applicationinsights-web
```

### Step 2: Create Application Insights in Azure

**Option A: Azure Portal**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Application Insights"
4. Fill in:
   - Name: `texas-build-pros`
   - Resource Group: `texas-build-pros-rg`
   - Region: `East US`
   - Workspace: (create new or use existing)
5. Click "Review + Create"
6. Once created, go to resource → Properties
7. Copy the **Connection String**

**Option B: Azure CLI**
```bash
az monitor app-insights component create \
  --app texas-build-pros \
  --location eastus \
  --resource-group texas-build-pros-rg \
  --application-type web
  
# Get connection string
az monitor app-insights component show \
  --app texas-build-pros \
  --resource-group texas-build-pros-rg \
  --query connectionString -o tsv
```

### Step 3: Configure Environment Variables

Create `.env.local` file in project root:

```env
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=12345678-1234-1234-1234-123456789012;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/
```

**⚠️ Important:** Replace with YOUR actual connection string from Step 2!

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Verify Telemetry is Working

1. Open your app in browser: http://localhost:5173
2. Check browser console - you should see:
   ```
   ✅ Application Insights initialized
   ```
3. Navigate around your app (click links, buttons)
4. Go to Azure Portal → Application Insights → Live Metrics
5. You should see live data flowing in!

---

## 🎯 What's Already Tracked

Without writing ANY code, you're already tracking:

- ✅ Page views on every route change
- ✅ All API calls (when you add backend)
- ✅ JavaScript errors
- ✅ Promise rejections
- ✅ User authentication events
- ✅ Performance metrics

---

## 📊 View Your Data

### Live Metrics (Real-time)
1. Azure Portal → Application Insights → Live Metrics
2. See requests, failures, and performance in real-time

### Logs (Historical)
1. Azure Portal → Application Insights → Logs
2. Run KQL queries:

```kql
// Page views in last 24 hours
pageViews
| where timestamp > ago(24h)
| summarize count() by name
| order by count_ desc

// All events
customEvents
| where timestamp > ago(24h)
| project timestamp, name, customDimensions
| order by timestamp desc
```

### Application Map
1. Azure Portal → Application Insights → Application Map
2. Visual representation of your app dependencies

---

## 🔥 Test It Works

### Test 1: Page View Tracking

1. Navigate to http://localhost:5173
2. Click through a few pages
3. Open browser DevTools → Network tab
4. Filter for "dc.services.visualstudio.com"
5. You should see POST requests sending telemetry!

### Test 2: Error Tracking

1. Open browser console
2. Type: `throw new Error("Test error")`
3. Check Application Insights → Failures
4. Your error should appear within 2-3 minutes

### Test 3: Custom Event

1. Open browser console
2. Type:
```javascript
// Access telemetry from window (for testing)
window.telemetry = (await import('./src/lib/telemetry.ts')).telemetry;
window.telemetry.trackEvent('TestEvent', { test: 'success' });
```
3. Check Application Insights → Events
4. Your custom event should appear!

---

## 🐛 Troubleshooting

### "Application Insights not initialized"

- ❌ Connection string not set in `.env.local`
- ❌ Wrong environment variable name (must be `VITE_*` prefix)
- ❌ Forgot to restart dev server after adding `.env.local`

**Fix:**
1. Verify `.env.local` exists with correct connection string
2. Restart dev server: `npm run dev`

### No Data in Azure Portal

- ⏳ Data can take 2-5 minutes to appear
- ❌ Wrong connection string
- ❌ CORS issue (check browser console for errors)

**Fix:**
1. Wait a few minutes
2. Check Live Metrics (faster than logs)
3. Verify connection string is correct

### CORS Errors in Console

```
Access to fetch at 'https://dc.services.visualstudio.com/...' has been blocked by CORS
```

This is normal! Application Insights uses a different method that bypasses CORS for sending telemetry. Your data is still being sent.

---

## ⚙️ Configuration Options

Edit `/src/lib/telemetry.ts` config:

```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    
    // Disable auto tracking if you want manual control
    enableAutoRouteTracking: false,
    
    // Sampling: reduce data by 50% (saves cost)
    samplingPercentage: 50,
    
    // Disable tracking for specific scenarios
    disableExceptionTracking: false,
    disableFetchTracking: false,
    
    // Performance
    maxBatchInterval: 5000, // Send every 5 seconds
    maxBatchSizeInBytes: 10000,
  }
});
```

---

## 📈 Next Steps

1. ✅ Telemetry is working locally
2. 🔄 Add backend API telemetry (see telemetry-implementation.md)
3. 🚀 Deploy to Azure Static Web Apps
4. 📊 Create custom dashboards
5. 🔔 Setup alerts for errors

---

## 💰 Cost

### Free Tier Includes:
- 5 GB data ingestion per month
- 90 days data retention
- Real-time monitoring

### When You'll Need to Pay:
- Over 5 GB/month (unlikely for small app)
- Longer retention (can extend to 730 days)

**Typical monthly cost for this app:** $0 (stays within free tier)

---

## 🆘 Get Help

- 📚 [Full Documentation](./telemetry-implementation.md)
- 🔗 [Microsoft Docs](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- 💬 [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-application-insights)

---

**That's it! You now have enterprise-grade telemetry tracking your React app! 🎉**
