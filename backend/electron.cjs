const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

async function createWindow() {
  // 1. Dynamically import the ES Module server (Fixes the ERR_REQUIRE_ESM crash)
  try {
    await import('./dist/server.js');
  } catch (err) {
    console.error("Failed to start backend server:", err);
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Derma Clinic System",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    }
  });
  
  // 2. Load the Express server we just started
  setTimeout(() => {
    mainWindow.loadURL('http://127.0.0.1:5003');
  }, 3000); 

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 3. Start the app
app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});