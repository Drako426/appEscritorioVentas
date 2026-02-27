const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
  guardarVentaOffline: (venta) => ipcRenderer.invoke("offline:guardar-venta", venta),
  obtenerVentasOffline: () => ipcRenderer.invoke("offline:obtener-ventas"),
  eliminarVentaOffline: (id) => ipcRenderer.invoke("offline:eliminar-venta", id),
  marcarVentaOfflineFallida: (id, error) => ipcRenderer.invoke("offline:marcar-fallo-venta", id, error)
})
