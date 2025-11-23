# Project Renamed: Legacy Builders

## ✅ What Changed

**Old Name:** Texas Build Pros  
**New Name:** Legacy Builders

---

## 📝 Updated References

### Repository
- **Old:** `texas-build-pros`
- **New:** `legacy-builders`

### Azure Resources
- **Old:** `texas-build-pros-rg`
- **New:** `legacy-builders-rg`

- **Old:** `texas-build-pros-insights-dev`
- **New:** `legacy-builders-insights-dev`

- **Old:** `texas-build-pros-cosmos-dev`
- **New:** `legacy-builders-cosmos-dev`

### Database
- **Old:** `TexasBuildPros`
- **New:** `LegacyBuilders`

---

## 🚀 Quick Deploy Commands (Updated)

### Create Infrastructure

```bash
# Create resource group
az group create --name legacy-builders-rg --location southcentralus

# Deploy with Bicep
az deployment group create \
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

---

## 📁 Files Updated

✅ `infrastructure/main.bicep` - All resource names updated  
✅ `infrastructure/README.md` - Documentation updated  
✅ `infrastructure/QUICK-START.md` - Commands updated  
✅ `README.md` - Project name and description updated  
✅ `.env.local.example` - Instructions updated  

---

## ⚠️ Action Required

### 1. Rename Repository (GitHub)

```bash
# Go to GitHub repository settings
# Repository name: legacy-builders
# Click "Rename"
```

### 2. Update Local Repository

```bash
# Update remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/legacy-builders.git

# Verify
git remote -v
```

### 3. Rename Local Folder

```bash
# Navigate to parent directory
cd D:\Code

# Rename folder
Rename-Item -Path "texas-build-pros" -NewName "legacy-builders"

# Navigate to new folder
cd legacy-builders
```

### 4. Update Any Existing Azure Resources

If you already created resources with the old name:

**Option A: Delete and recreate (Recommended if nothing deployed yet)**
```bash
# Delete old resource group
az group delete --name texas-build-pros-rg --yes

# Create new with correct name
az group create --name legacy-builders-rg --location southcentralus
az deployment group create --resource-group legacy-builders-rg --template-file infrastructure/main.bicep
```

**Option B: Keep existing resources (If already in use)**
- No action needed, just use new naming for future resources
- Update `.env.local` with existing connection string

---

## ✅ Checklist

- [ ] Rename GitHub repository to `legacy-builders`
- [ ] Update local git remote URL
- [ ] Rename local folder from `texas-build-pros` to `legacy-builders`
- [ ] Delete old Azure resources (if not in use)
- [ ] Deploy new infrastructure with correct naming
- [ ] Update `.env.local` with new connection string
- [ ] Test application
- [ ] Update any documentation or links

---

## 🎯 Next Steps

1. **Rename everything:**
   ```bash
   # GitHub repo
   # Local folder  
   # Git remote
   ```

2. **Deploy infrastructure:**
   ```bash
   az group create --name legacy-builders-rg --location southcentralus
   az deployment group create --resource-group legacy-builders-rg --template-file infrastructure/main.bicep
   ```

3. **Update .env.local:**
   - Get connection string from deployment
   - Add to `.env.local`

4. **Test:**
   ```bash
   npm install
   npm run dev
   ```

---

**All code is updated and ready for Legacy Builders!** 🎉
