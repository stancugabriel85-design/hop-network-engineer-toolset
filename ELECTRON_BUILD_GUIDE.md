# 🚀 Hop! Electron Build Guide

Complete guide to building Hop! as a standalone desktop application.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)
3. **Git** (optional, for version control)

## 🔧 Initial Setup

### Step 1: Install Dependencies

```bash
# Install root dependencies (including Electron)
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Verify Installation

```bash
# Check if Electron is installed
npx electron --version
```

## 🧪 Testing in Development Mode

Before building, test the Electron app in development mode:

```bash
# Option 1: Test with production build
npm run build-client
npm run electron

# Option 2: Test with hot-reload (development)
npm run electron-dev
```

The app should open in a desktop window with the backend server running automatically.

## 📦 Building for Production

### Build for Windows

```bash
npm run build-win
```

**Output:**
- `dist/Hop! Setup 1.0.0.exe` - Installer (recommended)
- `dist/Hop! 1.0.0.exe` - Portable executable

**Requirements:**
- Can be built on Windows, macOS, or Linux
- Windows users: No additional requirements
- macOS/Linux users: Install `wine` for cross-compilation

### Build for macOS

```bash
npm run build-mac
```

**Output:**
- `dist/Hop!-1.0.0.dmg` - Disk image installer
- `dist/Hop!-1.0.0-mac.zip` - Zipped app bundle

**Requirements:**
- Must be built on macOS
- Xcode Command Line Tools installed

### Build for Linux

```bash
npm run build-linux
```

**Output:**
- `dist/Hop!-1.0.0.AppImage` - Universal Linux executable
- `dist/hop_1.0.0_amd64.deb` - Debian/Ubuntu package

**Requirements:**
- Can be built on any platform
- Linux users: No additional requirements

### Build for All Platforms

```bash
npm run build-all
```

**Note:** This requires platform-specific tools for each target OS.

## 📁 Build Output Structure

```
dist/
├── Hop! Setup 1.0.0.exe          # Windows installer
├── Hop! 1.0.0.exe                # Windows portable
├── Hop!-1.0.0.dmg                # macOS installer
├── Hop!-1.0.0-mac.zip            # macOS app bundle
├── Hop!-1.0.0.AppImage           # Linux AppImage
└── hop_1.0.0_amd64.deb           # Debian package
```

## 🎨 Custom Icons (Optional)

To use custom icons, create these files in the `build/` directory:

```
build/
├── icon.ico      # Windows icon (256x256)
├── icon.icns     # macOS icon (512x512)
└── icon.png      # Linux icon (512x512)
```

You can use your rabbit logo! Convert it to the required formats:
- **Windows (.ico):** Use online converter or GIMP
- **macOS (.icns):** Use `iconutil` on macOS
- **Linux (.png):** Just use the PNG directly

## ⚙️ Build Configuration

The build is configured in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.hop.networktools",
    "productName": "Hop!",
    "files": [
      "electron.js",
      "server/**/*",
      "client/build/**/*",
      "node_modules/**/*"
    ]
  }
}
```

## 🐛 Troubleshooting

### Build Fails with "Cannot find module"

**Solution:** Ensure all dependencies are installed:
```bash
npm install
cd client && npm install && cd ..
```

### "electron-builder not found"

**Solution:** Install dev dependencies:
```bash
npm install --save-dev electron electron-builder
```

### Windows Defender Blocks the App

**Solution:** This is normal for unsigned apps. You can:
1. Click "More info" → "Run anyway"
2. Add exception to Windows Defender
3. (For distribution) Sign the app with a code signing certificate

### macOS Says "App is Damaged"

**Solution:** macOS Gatekeeper blocks unsigned apps. Run:
```bash
xattr -cr "/Applications/Hop!.app"
```

### Linux AppImage Won't Run

**Solution:** Make it executable:
```bash
chmod +x Hop!-1.0.0.AppImage
./Hop!-1.0.0.AppImage
```

## 📊 File Sizes

Expected file sizes for built applications:

- **Windows Installer:** ~150-200 MB
- **macOS DMG:** ~150-200 MB
- **Linux AppImage:** ~150-200 MB

The size includes:
- Electron framework (~100 MB)
- Node.js runtime
- Your application code
- All dependencies

## 🔒 Security Notes

### Code Signing (Optional but Recommended)

For production distribution:

**Windows:**
```bash
# Get a code signing certificate from a CA
# Configure in package.json:
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "your-password"
}
```

**macOS:**
```bash
# Requires Apple Developer account ($99/year)
# Configure in package.json:
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

## 🚀 Distribution

### Windows
- Upload installer to your website
- Users download and run the .exe
- No admin rights needed for portable version

### macOS
- Distribute the .dmg file
- Users drag to Applications folder
- First run requires right-click → Open (for unsigned apps)

### Linux
- Distribute AppImage (universal)
- Or add to package repositories (.deb for Debian/Ubuntu)

## 📝 Build Scripts Reference

```bash
npm run build-client      # Build React app only
npm run electron          # Run Electron with built app
npm run electron-dev      # Run Electron in dev mode
npm run build            # Build for current platform
npm run build-win        # Build for Windows
npm run build-mac        # Build for macOS
npm run build-linux      # Build for Linux
npm run build-all        # Build for all platforms
```

## 🎯 Next Steps

1. ✅ Test the app in development mode
2. ✅ Build for your platform
3. ✅ Test the built executable
4. ✅ Add custom icons (optional)
5. ✅ Sign the app (for distribution)
6. ✅ Create installer/package
7. ✅ Distribute to users

## 💡 Tips

- Always test the built app before distributing
- Keep the `dist/` folder in `.gitignore`
- Version your releases (update `version` in package.json)
- Create release notes for each version
- Consider auto-updates with `electron-updater` (advanced)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review electron-builder logs in `dist/`
3. Check Electron documentation: https://www.electronjs.org/
4. Check electron-builder docs: https://www.electron.build/

---

**Happy Building! 🎉**

Your Hop! network toolset is now ready to be packaged as a professional desktop application!
