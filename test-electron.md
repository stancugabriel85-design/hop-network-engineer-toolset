# Testing Electron Setup

## Quick Test (Production Mode)

This tests the built React app in Electron:

```bash
# 1. Build the React app first
cd client
npm run build
cd ..

# 2. Run Electron
npx electron .
```

**Expected Result:** Hop! application opens in a desktop window with backend running on port 3001.

## Development Mode Test

This tests with React hot-reload:

```bash
# Run Electron with React dev server
npm run electron-dev
```

**Expected Result:** 
- React dev server starts on port 3000
- Electron window opens after React is ready
- Hot-reload works when you edit files

## Troubleshooting

### Issue: Blank white screen
**Cause:** React build doesn't exist  
**Fix:** Run `cd client && npm run build && cd ..`

### Issue: "Cannot GET /"
**Cause:** Wrong URL path  
**Fix:** Check console logs for the URL being loaded

### Issue: Backend not responding
**Cause:** Server didn't start  
**Fix:** Check terminal for server startup logs

### Issue: Port 3001 already in use
**Cause:** Another instance is running  
**Fix:** Kill the process using port 3001 or change PORT in electron.js

## What Should Happen

1. ✅ Electron window opens (1400x900)
2. ✅ Backend server starts automatically on port 3001
3. ✅ Frontend loads from client/build/index.html
4. ✅ You see the Hop! interface with the rabbit theme
5. ✅ All network tools are accessible from the sidebar
6. ✅ Real-time monitoring works via Socket.IO

## Console Output Should Show

```
Starting backend server from: C:\...\server\index.js
Current directory: C:\...\
Backend server starting on port 3001...
[Server] Database initialized
[Server] Hop! server running on port 3001
Loading URL: file://C:\...\client\build\index.html
Mode: Production
Hop! window ready
```

## Next Steps After Successful Test

Once the app loads correctly:

1. Test a few network tools to verify functionality
2. Proceed with building the installer: `npm run build-win`
3. Find your executable in the `dist/` folder
