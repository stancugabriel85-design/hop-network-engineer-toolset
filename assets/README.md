# Assets Folder

This folder contains application icons and resources for the Hop! Electron app.

## Required Icon Files

### For Windows:
- **icon.ico** - Windows application icon (256x256px, .ico format)
  - Used for: Window icon, taskbar, installer

### For macOS (optional):
- **icon.icns** - macOS application icon (512x512px, .icns format)
  - Used for: Dock icon, app bundle

### For Linux (optional):
- **icon.png** - Linux application icon (512x512px, .png format)
  - Used for: Application menu, taskbar

## How to Add Your Icon

1. **Convert your rabbit logo to .ico format:**
   - Use an online converter: https://convertio.co/png-ico/
   - Or use GIMP/Photoshop to export as .ico
   - Recommended size: 256x256px

2. **Place the file here:**
   - Save as: `assets/icon.ico`

3. **For React app favicon:**
   - Also save a copy as: `client/public/favicon.ico`
   - This will show in the browser tab

## Current Configuration

The following files reference icons from this folder:

- `electron.js` - Line 16: `icon: path.join(__dirname, 'assets', 'icon.ico')`
- `package.json` - Build config: `"icon": "assets/icon.ico"`

## Testing

After adding your icon:
1. Rebuild the React app: `cd client && npm run build && cd ..`
2. Run Electron: `npm run electron`
3. Your icon should appear in the window title bar and taskbar

## Building Installers

When you run `npm run build-win`, the icon from this folder will be used for:
- Application executable icon
- Installer icon
- Desktop shortcut icon
- Start menu icon
