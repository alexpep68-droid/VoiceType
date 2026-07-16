const { app, globalShortcut, Tray, Menu, clipboard, shell, nativeImage } = require('electron');
const { execFile } = require('child_process');

// VoiceType actually dictates inside a real browser, not inside this
// Electron window. Reason: Electron's bundled Chromium does NOT ship
// Google's speech-recognition backend that Chrome has, so
// webkitSpeechRecognition silently never returns results in Electron —
// the mic light turns on but nothing gets transcribed. Chrome/Edge (the
// user's default browser) has the real thing, and we already confirmed
// dictation works fine there. So this app's job is just: open the site,
// watch the clipboard for the auto-copied result, and paste it back into
// whatever app was focused before.
const APP_URL = 'https://voice-type-gilt.vercel.app';
const SHORTCUT = 'Alt+Space';
const POLL_MS = 400;
const MAX_ARMED_MS = 2 * 60 * 1000; // stop watching after 2 minutes idle

const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAlUlEQVR4nO2WMRKAIAwED8deO32D/v8p/sHSH2hFpcVdhMmE4UonMZsDAmlathuOGjyLdwAAGK2J13m8vs3rLv8nqZvwq/AfEGkJmOJKnAxQQzSA0pUSH8MBtXslL4YDHcAdwDJi2bwYDgC6C2x8HAcAvivFLfk6zir1Hoi1BB2gSQD6FFjeBG2N4loyD6JScnfAHeAB0bUkyWiQscMAAAAASUVORK5CYII=';

let tray;
let armed = false;
let baselineClipboard = '';
let targetWindowHandle = null;
let pollTimer = null;
let armTimeout = null;

// --- Windows-only helpers via PowerShell, no native/compiled modules. ---

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
    callback(stdout.trim() || null);
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
Start-Sleep -Milliseconds 200
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("^v")
`;
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], (err) => {
    if (err) console.error('restoreFocusAndPaste failed', err);
  });
}

function safeReadClipboard() {
  try {
    return clipboard.readText();
  } catch (e) {
    return '';
  }
}

function updateTrayState() {
  if (!tray) return;
  tray.setToolTip(
    armed
      ? 'VoiceType — esperando el texto dictado… (Alt+Espacio para cancelar)'
      : 'VoiceType — Alt+Espacio para dictar'
  );
}

function disarm() {
  armed = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (armTimeout) {
    clearTimeout(armTimeout);
    armTimeout = null;
  }
  updateTrayState();
}

function armAndWatch() {
  baselineClipboard = safeReadClipboard();
  armed = true;
  updateTrayState();

  pollTimer = setInterval(() => {
    const current = safeReadClipboard();
    if (current !== baselineClipboard && current.trim() !== '') {
      disarm();
      restoreFocusAndPaste(targetWindowHandle);
    }
  }, POLL_MS);

  armTimeout = setTimeout(disarm, MAX_ARMED_MS);
}

function triggerToggle() {
  // Pressing the shortcut again while waiting cancels it instead of
  // opening a second browser tab.
  if (armed) {
    disarm();
    return;
  }
  getForegroundWindowHandle((handle) => {
    targetWindowHandle = handle;
    armAndWatch();
    shell.openExternal(APP_URL);
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`);
  tray = new Tray(icon);
  updateTrayState();
  const menu = Menu.buildFromTemplate([
    { label: 'Dictar ahora (Alt+Espacio)', click: () => triggerToggle() },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => triggerToggle());
}

app.whenReady().then(() => {
  createTray();
  const ok = globalShortcut.register(SHORTCUT, triggerToggle);
  if (!ok) {
    console.error(`No se pudo registrar el atajo global ${SHORTCUT}. Puede que otra app ya lo esté usando.`);
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Intentional no-op — VoiceType has no windows of its own, it lives in
  // the tray and dictation happens in the user's real browser.
});
