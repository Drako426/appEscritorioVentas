let storePromise = null

async function getStore() {
  if (!storePromise) {
    storePromise = import("electron-store").then((mod) => {
      const Store = mod.default || mod
      return new Store({ name: "offline-ventas" })
    })
  }

  return storePromise
}

async function guardarVentaOffline(venta) {
  const store = await getStore()
  const pendientes = store.get("ventasPendientes", [])

  pendientes.push({
    ...venta,
    offline_id: Date.now(),
    fail_count: 0,
    last_error: null,
    last_attempt_at: null
  })

  store.set("ventasPendientes", pendientes)
}

async function obtenerVentasOffline() {
  const store = await getStore()
  return store.get("ventasPendientes", [])
}

async function eliminarVentaOffline(id) {
  const store = await getStore()
  const pendientes = store.get("ventasPendientes", [])
  const nuevas = pendientes.filter((v) => v.offline_id !== id)
  store.set("ventasPendientes", nuevas)
}

async function marcarVentaOfflineFallida(id, error) {
  const store = await getStore()
  const pendientes = store.get("ventasPendientes", [])
  const actualizadas = pendientes.map((v) => {
    if (v.offline_id !== id) return v
    return {
      ...v,
      fail_count: Number(v.fail_count || 0) + 1,
      last_error: error || "Error de sincronizacion",
      last_attempt_at: new Date().toISOString()
    }
  })
  store.set("ventasPendientes", actualizadas)
}

module.exports = {
  guardarVentaOffline,
  obtenerVentasOffline,
  eliminarVentaOffline,
  marcarVentaOfflineFallida
}
