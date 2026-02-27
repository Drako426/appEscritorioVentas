const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")

const {
  guardarVentaOffline,
  obtenerVentasOffline,
  eliminarVentaOffline,
  marcarVentaOfflineFallida
} = require("./offlineStore")

let mainWindow

function registerOfflineIpc() {
  ipcMain.handle("offline:guardar-venta", async (_, venta) => {
    await guardarVentaOffline(venta)
    return true
  })

  ipcMain.handle("offline:obtener-ventas", async () => {
    return await obtenerVentasOffline()
  })

  ipcMain.handle("offline:eliminar-venta", async (_, id) => {
    await eliminarVentaOffline(id)
    return true
  })

  ipcMain.handle("offline:marcar-fallo-venta", async (_, id, error) => {
    await marcarVentaOfflineFallida(id, error)
    return true
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      sandbox: true
    }
  })

  const rendererUrl =
    process.env.ELECTRON_RENDERER_URL || "http://localhost:5173"

  const rendererFile = path.join(
    __dirname,
    "..",
    "renderer",
    "dist",
    "index.html"
  )

  if (app.isPackaged) {
    mainWindow.loadFile(rendererFile)
  } else {
    mainWindow.loadURL(rendererUrl)
    mainWindow.webContents.openDevTools({ mode: "detach" })
  }
}

app.whenReady().then(() => {
  registerOfflineIpc()
  createWindow()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
