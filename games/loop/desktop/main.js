// LOOP desktop shell. Runs the game page in a window and connects it to Steam when Steam is available.
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 480 is Valve's public test app (Spacewar). Set LOOP_STEAM_APP_ID to the real App ID once Steamworks assigns one.
const STEAM_APP_ID = Number(process.env.LOOP_STEAM_APP_ID || 480);

let steamworks = null;
let steam = null;
try {
  steamworks = require('steamworks.js');
  steam = steamworks.init(STEAM_APP_ID);
} catch (err) {
  // Not launched through Steam, or steamworks.js is not installed: the game still runs, without Steam features.
  console.log('[LOOP] Steam not available:', err.message);
}
if (steam) {
  try { steamworks.electronEnableSteamOverlay(); } catch (err) { console.log('[LOOP] Overlay not enabled:', err.message); }
}

const safe = fn => { try { return fn(); } catch (err) { console.log('[LOOP] Steam call failed:', err.message); return null; } };

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#11131a',
    autoHideMenuBar: true,
    title: 'LOOP',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // F11 or Alt+Enter toggles fullscreen.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  // Steam sets SteamDeck=1 on the Deck; start fullscreen there.
  if (process.env.SteamDeck === '1') win.setFullScreen(true);
}

ipcMain.handle('steam:info', () => ({
  available: !!steam,
  language: steam ? safe(() => steam.apps.currentGameLanguage()) : null,
}));
ipcMain.on('steam:achievement', (_event, id) => {
  if (steam && typeof id === 'string') safe(() => steam.achievement.activate(id));
});
ipcMain.on('win:fullscreen', event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setFullScreen(!win.isFullScreen());
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
