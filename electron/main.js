const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

// URL of the deployed VoiceType web app. The desktop wrapper just loads this
// page and adds OS-level integration (global shortcut + auto-paste).
const APP_URL = 'https://voice-type-gilt.vercel.app';
const SHORTCUT = 'Alt+Space';

// Small 32x32 mic icon, embedded so the app doesn't depend on a separate
// icon file at build time.
const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAlUlEQVR4nO2WMRKAIAwED8deO32D/v8p/sHSH2hFpcVdhMmE4UonMZsDAmlathuOGjyLdwAAGK2J13m8vs3rLv8nqZvwq/AfEGkJmOJKnAxQQzSA0pUSH8MBtXslL4YDHcAdwDJi2bwYDgC6C2x8HAcAvivFLfk6zir1Hoi1BB2gSQD6FFjeBG2N4loyD6JScnfAHeAB0bUkyWiQscMAAAAASUVORK5CYII=';

let mainWindow;
let tray;
let lastForegroundWindow = null;

// --- Windows-only helpers, implemented via PowerShell so no native/compiled
// node modules are needed (keeps the build reproducible from any machine). ---

function getForegroundWindowHandle(callback) {
  const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class VT_Win32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
}
"@
[VT_Win32]::GetForegroundWindow().ToInt64()
`;
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], (err, stdout) => {
    if (err) {
      console.error('getForegroundWindowHandle failed', err);
      return callback(null);
    }
    const handle = stdout.trim();
    callback(handle || null);
  });
}

function restoreFocusAndPaste(handle) {
  if (!handle) return;
  const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class VT_Win32b {
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
[VT_Win32b]::SetForegroundWindow([IntPtr]${handle}) | Out-Null
Start-Sleep -Milliseconds 150
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("^v")
`;
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], (err) => {
    if (err) console.error('restoreFocusAndPaste failed', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 760,
    show: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(APP_URL);

  // Keep the app running in the tray instead of fully closing.
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`);
  tray = new Tray(icon);
  tray.setToolTip('VoiceType — Alt+Espacio para dictar');
  const menu = Menu.buildFromTemplate([
    { label: 'Abrir VoiceType', click: () => mainWindow.show() },
    { label: 'Dictar ahora (Alt+Espacio)', click: () => triggerToggle() },
    { type: 'separator' },
    { label: 'Salir', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => mainWindow.show());
}

function triggerToggle() {
  getForegroundWindowHandle((handle) => {
    lastForegroundWindow = handle;
    mainWindow.webContents.send('toggle-dictation');
    // Show the window without stealing focus from the app the user was
    // typing in, so the mic keeps listening to the right context.
    mainWindow.showInactive();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  const ok = globalShortcut.register(SHORTCUT, triggerToggle);
  if (!ok) {
    console.error(`No se pudo registrar el atajo global ${SHORTCUT}. Puede que otra app ya lo esté usando.`);
  }

  // Renderer calls this (via preload.js) right after it copies the polished
  // text to the clipboard, so we know it's safe to paste it back.
  ipcMain.on('dictation-done', () => {
    mainWindow.hide();
    restoreFocusAndPaste(lastForegroundWindow);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Intentionally do nothing — VoiceType lives in the tray.
});
