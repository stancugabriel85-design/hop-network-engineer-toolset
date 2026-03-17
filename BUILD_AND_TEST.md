# 🔧 Build and Test Guide for Hop! Electron App

## ⚠️ IMPORTANT: Build Order

Always follow this exact order to ensure the app works:

### Step 1: Build React Frontend
```powershell
cd client
npm run build
cd ..
```

**Verify:** Check that `client/build/index.html` exists

### Step 2: Test in Development Mode (Optional)
```powershell
npm run electron
```

This tests the app with the built React files before packaging.

### Step 3: Build Windows Installer
```powershell
# Disable code signing (we don't have a certificate)
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"

# Build the installer
npm run build:win
```

### Step 4: Find Your Installer
Look in the `dist/` folder:
- **Installer:** `Hop! - Network Engineer Toolset Setup 1.0.0.exe`
- **Portable:** `Hop-NetworkEngineerToolset-portable.exe`

### Step 5: Install and Test
1. Run the installer from `dist/` folder
2. Install to a location (e.g., `C:\Program Files\Hop!`)
3. Launch the app from desktop shortcut or Start menu
4. Check console output for errors

## 🐛 Debugging Launch Issues

If the app doesn't launch after installation:

### Check 1: Console Logs
The app logs to console. To see them:
1. Open the app
2. Press `Ctrl+Shift+I` to open DevTools
3. Check the Console tab for errors

### Check 2: Verify Files Were Packaged
Navigate to installation folder (e.g., `C:\Program Files\Hop!`) and verify:
- `resources/app.asar` exists
- `resources/server/` folder exists
- `resources/client/build/` folder exists
- `resources/assets/` folder exists

### Check 3: Backend Server
The backend should start automatically. Check if:
- Port 3001 is available (not used by another app)
- Node.js is bundled with the app
- Server files are in the correct location

### Check 4: Frontend Files
The React app should load from `client/build/index.html`. Check if:
- `client/build/index.html` exists in the packaged app
- The file path in electron.js is correct
- No CORS or file protocol errors in console

## 📝 Common Issues and Fixes

### Issue: "Cannot find module 'server/index.js'"
**Fix:** The server files weren't packaged correctly.
- Check `package.json` "files" includes `"server/**/*"`
- Check `extraResources` includes server folder
- Rebuild: `npm run build:win`

### Issue: Blank white screen
**Fix:** React build doesn't exist or wasn't packaged.
- Run `cd client && npm run build && cd ..`
- Check `client/build/index.html` exists
- Rebuild: `npm run build:win`

### Issue: "Port 3001 already in use"
**Fix:** Another instance is running or port is occupied.
- Close all Hop! instances
- Kill process using port 3001: `netstat -ano | findstr :3001`
- Restart the app

### Issue: Icon not showing
**Fix:** Icon file missing or wrong path.
- Verify `assets/icon.ico` exists
- Check icon is 256x256px .ico format
- Rebuild: `npm run build:win`

## 🔍 Detailed Build Process

What happens when you run `npm run build:win`:

1. **Prebuild:** Runs `npm run build-client`
   - Builds React app to `client/build/`
   - Creates optimized production bundle

2. **Electron Builder:** Packages everything
   - Bundles `electron.js` (main process)
   - Includes `server/**/*` (backend)
   - Includes `client/build/**/*` (frontend)
   - Includes `assets/**/*` (icons)
   - Includes required `node_modules`
   - Creates installer and portable .exe

3. **Output:** Creates in `dist/` folder
   - NSIS installer (with uninstaller)
   - Portable executable (no installation needed)

## 📊 File Size Expectations

- **Installer:** ~150-250 MB
- **Installed app:** ~200-300 MB
- **Portable .exe:** ~150-250 MB

Size includes:
- Electron framework (~100 MB)
- Node.js runtime
- All npm dependencies
- Your application code
- React production build

## ✅ Verification Checklist

Before distributing your app:

- [ ] React app builds without errors
- [ ] Electron app runs in development mode
- [ ] Installer builds successfully
- [ ] Installed app launches
- [ ] Backend server starts (check port 3001)
- [ ] Frontend loads correctly
- [ ] All network tools work
- [ ] Icon displays correctly
- [ ] App name shows as "Hop! - Network Engineer Toolset"
- [ ] Desktop shortcut created
- [ ] Start menu entry created
- [ ] Uninstaller works

## 🚀 Distribution

Once everything works:

1. **Test on a clean machine** (without Node.js installed)
2. **Create release notes** (what's new, known issues)
3. **Distribute the installer** from `dist/` folder
4. **Provide support info** (how to report bugs)

## 💡 Tips

- Always rebuild React before building Electron
- Delete `dist/` folder before rebuilding to ensure clean build
- Test the portable version - it's easier for quick testing
- Keep the installer for distribution to end users
- Version your releases (update `version` in package.json)

---

**Need help?** Check the console logs first - they show exactly what's happening!
