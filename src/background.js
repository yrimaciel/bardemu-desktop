'use strict'

import { app, protocol, BrowserWindow, Tray, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import './logConfig'
import path from 'path'
const isDevelopment = process.env.NODE_ENV !== 'production'
import { autoUpdater } from 'electron-updater'

let isSingleInstance = app.requestSingleInstanceLock()

if(!isSingleInstance) {
  app.quit()
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win
let tray = null

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    center: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false
    },
    title: 'BarDeMu Lanches'
  })
  win.removeMenu()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  
  win.webContents.on('did-finish-load', () => {
    console.log("Up!");
    win.setTitle("BarDeMu Lanches")
    win.show()
  })
}


app.on('second-instance', () => {
  if(win) {
    if(win.isMinimized()) {
      win.restore()
    } else {
      win.focus()
    }
  }
})
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS_DEVTOOLS)
  //   } catch (e) {
  //     console.error('Vue Devtools failed to install:', e.toString())
  //   }
  // }
  createWindow()

  autoUpdater.checkForUpdatesAndNotify()

  tray = new Tray(path.join(__dirname, '../build/app-tray-icon.png'))

  let contextMenu;

  if(isDevelopment) {
    contextMenu = Menu.buildFromTemplate([
      { label: "Abrir", type: "normal", click: () => {
        win.focus();
      }},
      { label: "Reload", type: "normal", click: () => {
        win.reload()
      }},
      { label: "Abrir DevTools", type: "normal", click: () => {
        win.webContents.openDevTools()
      }},
      { label: "Redefinir Tela", type: "normal", click: () => {
        win.setSize(1200, 800)
      }},
      { label: "Ver logs", type: "normal", click: () => {
        if(isDevelopment) {
          shell.openPath(path.join(app.getAppPath(), '../logs'));
        } else {
          shell.openPath(path.join(app.getAppPath(), '../../../logs'));
        }
      }},
      { label: "Fechar", type: "normal", click: () => {
        win.closable = true
        win.close()
      }}
    ])
  } else {
    contextMenu = Menu.buildFromTemplate([
      { label: "Abrir", type: "normal", click: () => {
        win.focus();
      }},
      { label: "Pedidos", type: "normal", click: () => {
        win.webContents.send('router-redirect', '/orders');
        win.focus();
      }},
      { label: "Ver logs", type: "normal", click: () => {
        if(isDevelopment) {
          shell.openPath(path.join(app.getAppPath(), '../logs'));
        } else {
          shell.openPath(path.join(app.getAppPath(), '../../../logs'));
        }
      }},
      { label: "Verificar Atualização", type: "normal", click: () => {
        autoUpdater.checkForUpdates()
      }},
      { label: "Fechar", type: "normal", click: () => {
        win.closable = true
        win.close()
      }}
    ])
  }

  tray.setToolTip('BarDeMu Lanches')
  tray.setContextMenu(contextMenu)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
