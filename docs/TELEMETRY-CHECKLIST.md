# Telemetry Setup Checklist

Use this checklist to get telemetry fully operational.

## ✅ Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install @microsoft/applicationinsights-web
```

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### 2. Create Application Insights in Azure

**Option A: Azure Portal**
1. ⬜ Go to https://portal.azure.com
2. ⬜ Click "Create a resource"
3. ⬜ Search "Application Insights"
4. ⬜ Fill in details:
   - Name: `texas-build-pros`
   - Resource Group: `texas-build-pros-rg`
   - Region: `East US`
5. ⬜ Create resource
6. ⬜ Copy Connection String from Properties

**Option B: Azure CLI**
```bash
az monitor app-insights component create \
  --app texas-build-pros \
  --location eastus \
  --resource-group texas-build-pros-rg \
  --application-type web
```

**Connection String:** ⬜ Copied

---

### 3. Configure Environment Variables

**Create `.env.local` file in project root:**

```env
VITE_APPINSIGHTS_CONNECTION_STRING=<YOUR_CONNECTION_STRING>
```

**Checklist:**
- ⬜ Created `.env.local` file
- ⬜ Added connection string
- ⬜ Connection string starts with `InstrumentationKey=`
- ⬜ Added `.env.local` to `.gitignore` (security!)

---

### 4. Verify Installation

```bash
# Start dev server
npm run dev
```

**Open browser console and check for:**
```
✅ Application Insights initialized
```

**Checklist:**
- ⬜ Dev server started without errors
- ⬜ Saw "Application Insights initialized" message
- ⬜ No errors in browser console

---

### 5. Test Telemetry

#### Test 1: Page Views
1. ⬜ Navigate to http://localhost:5173
2. ⬜ Click through different pages
3. ⬜ Open DevTools Network tab
4. ⬜ Filter for "dc.services.visualstudio.com"
5. ⬜ See POST requests being sent

#### Test 2: Error Tracking
1. ⬜ Open browser console
2. ⬜ Type: `throw new Error("Test error")`
3. ⬜ Wait 2-3 minutes
4. ⬜ Go to Azure Portal → Application Insights → Failures
5. ⬜ See your test error

#### Test 3: Live Metrics
1. ⬜ Go to Azure Portal
2. ⬜ Open Application Insights resource
3. ⬜ Click "Live Metrics"
4. ⬜ Navigate around your app
5. ⬜ See real-time data flowing

---

### 6. Verify Auto-Tracking Works

**Page Views:**
- ⬜ Navigate to different routes
- ⬜ Check pageViews in Application Insights Logs:
```kql
pageViews
| where timestamp > ago(10m)
| project timestamp, name, url
```

**Custom Events:**
- ⬜ Trigger a user action (e.g., click button)
- ⬜ Check customEvents:
```kql
customEvents
| where timestamp > ago(10m)
| project timestamp, name, customDimensions
```

**Auth Tracking:**
- ⬜ Login to admin section
- ⬜ Check for `User_Authenticated` event:
```kql
customEvents
| where name == "User_Authenticated"
| where timestamp > ago(10m)
```

---

### 7. Production Deployment

#### Configure Azure Static Web App

**In Azure Portal → Static Web App → Configuration:**

Add application settings:
```
VITE_APPINSIGHTS_CONNECTION_STRING = <YOUR_CONNECTION_STRING>
```

**Checklist:**
- ⬜ Opened Azure Static Web App
- ⬜ Went to Configuration
- ⬜ Added connection string setting
- ⬜ Saved changes
- ⬜ Restarted app (if needed)

#### Deploy

```bash
npm run build
# Deploy via GitHub Actions or manually
```

**Checklist:**
- ⬜ Build succeeded
- ⬜ Deployed to Azure
- ⬜ Tested production site
- ⬜ Verified telemetry working in production

---

### 8. Create Dashboards & Alerts

#### Create Dashboard

**In Azure Portal → Application Insights:**
1. ⬜ Click "Workbooks" → "New"
2. ⬜ Add widgets for:
   - Request count
   - Response time
   - Error rate
   - User count
   - Custom events
3. ⬜ Save dashboard

#### Setup Alerts

**Create alert for high error rate:**
1. ⬜ Go to Alerts → New alert rule
2. ⬜ Condition: Error rate > 5%
3. ⬜ Action: Email notification
4. ⬜ Save alert

**Create alert for slow responses:**
1. ⬜ Go to Alerts → New alert rule
2. ⬜ Condition: Response time > 3 seconds
3. ⬜ Action: Email notification
4. ⬜ Save alert

---

## 🎯 Verification Checklist

### Frontend Telemetry Working
- ⬜ Page views tracked
- ⬜ Route changes tracked
- ⬜ Errors tracked
- ⬜ User actions tracked
- ⬜ Authentication events tracked
- ⬜ API calls will be tracked (once backend is ready)

### Azure Portal
- ⬜ Application Insights resource created
- ⬜ Connection string obtained
- ⬜ Live metrics showing data
- ⬜ Logs showing events
- ⬜ No errors in Application Insights

### Local Development
- ⬜ `.env.local` configured
- ⬜ No console errors
- ⬜ Telemetry initialization message shown
- ⬜ Network requests to Application Insights visible

### Production
- ⬜ Deployed to Azure Static Web App
- ⬜ Environment variables configured
- ⬜ Telemetry working in production
- ⬜ Dashboards created
- ⬜ Alerts configured

---

## 🚨 Troubleshooting

### Problem: "Application Insights not initialized"

**Possible Causes:**
- ⬜ Connection string not in `.env.local`
- ⬜ Wrong variable name (must be `VITE_*`)
- ⬜ Dev server not restarted

**Fix:**
1. ⬜ Check `.env.local` exists
2. ⬜ Verify variable name: `VITE_APPINSIGHTS_CONNECTION_STRING`
3. ⬜ Restart dev server
4. ⬜ Clear browser cache

---

### Problem: No Data in Azure Portal

**Possible Causes:**
- ⬜ Data takes 2-5 minutes to appear
- ⬜ Wrong connection string
- ⬜ Telemetry not actually running

**Fix:**
1. ⬜ Wait 5 minutes
2. ⬜ Check Live Metrics (faster than logs)
3. ⬜ Verify connection string matches
4. ⬜ Check browser console for errors

---

### Problem: TypeScript Errors

**Possible Causes:**
- ⬜ Package not installed
- ⬜ Types not recognized

**Fix:**
1. ⬜ Run `npm install @microsoft/applicationinsights-web`
2. ⬜ Restart TypeScript server in VS Code
3. ⬜ Check `tsconfig.json` includes `node_modules`

---

## 📚 Resources

- ⬜ Read [Quick Start Guide](./telemetry-quick-start.md)
- ⬜ Read [Complete Summary](./TELEMETRY-COMPLETE.md)
- ⬜ Bookmark [Microsoft Docs](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- ⬜ Bookmark [KQL Reference](https://learn.microsoft.com/azure/data-explorer/kusto/query/)

---

## 🎉 Success Criteria

Your telemetry setup is complete when:

- ✅ Package installed
- ✅ Application Insights resource created
- ✅ Connection string configured locally
- ✅ Dev server shows "initialized" message
- ✅ Page views appear in Azure Portal
- ✅ Errors tracked automatically
- ✅ Live Metrics showing data
- ✅ Production deployment configured
- ✅ Dashboards created
- ✅ Alerts configured

---

## 💪 You're Done!

Once all items are checked, your application has enterprise-grade telemetry!

**Next:** Implement the C# backend API with telemetry

---

**Questions?** Check the documentation or Azure Portal → Application Insights → Documentation
