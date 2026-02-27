import api from "./api"

const OFFLINE_SUPPORTED_ROUTES = new Set(["/ventas"])
let syncListenerRegistered = false

const queueState = {
  pending: 0,
  failed: 0,
  syncing: false,
  lastError: null
}

function emitQueueStatus() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new CustomEvent("offline-queue-status", {
    detail: { ...queueState }
  }))
}

function ok(data) {
  return { success: true, data, error: null }
}

function fail(error) {
  return { success: false, data: null, error }
}

function isNetworkError(error) {
  return !error?.response
}

function normalizeError(error) {
  if (!error) return "Error desconocido"
  if (typeof error === "string") return error

  if (isNetworkError(error)) {
    return "Sin conexion con el servidor"
  }

  return error.response?.data?.message || error.message || "Error de red"
}

function canQueueOffline(method, url) {
  return (
    method === "post" &&
    OFFLINE_SUPPORTED_ROUTES.has(url) &&
    Boolean(window.electron?.guardarVentaOffline)
  )
}

async function queueOfflineVenta(payload) {
  await window.electron.guardarVentaOffline(payload)
  const pendientes = (await window.electron.obtenerVentasOffline()) || []
  queueState.pending = pendientes.length
  queueState.failed = pendientes.filter((v) => Number(v.fail_count || 0) > 0).length
  queueState.lastError = null
  emitQueueStatus()

  return ok({
    offline: true,
    queued: true,
    message: "Operacion guardada offline"
  })
}

export async function syncPendingVentas() {
  if (!window.electron?.obtenerVentasOffline) return

  const pendientes = (await window.electron.obtenerVentasOffline()) || []
  queueState.pending = pendientes.length
  queueState.failed = pendientes.filter((v) => Number(v.fail_count || 0) > 0).length
  queueState.syncing = false
  emitQueueStatus()

  if (!pendientes.length) return

  queueState.syncing = true
  queueState.lastError = null
  emitQueueStatus()

  for (const venta of pendientes) {
    try {
      const { offline_id, ...payload } = venta
      await api.post("/ventas", payload)

      if (window.electron?.eliminarVentaOffline && offline_id != null) {
        await window.electron.eliminarVentaOffline(offline_id)
      }

      queueState.pending = Math.max(0, queueState.pending - 1)
      emitQueueStatus()
    } catch (error) {
      queueState.lastError = normalizeError(error)
      queueState.syncing = false
      emitQueueStatus()

      if (isNetworkError(error)) {
        break
      }

      if (window.electron?.marcarVentaOfflineFallida && venta.offline_id != null) {
        await window.electron.marcarVentaOfflineFallida(
          venta.offline_id,
          normalizeError(error)
        )

        const failCount = Number(venta.fail_count || 0) + 1
        if (failCount >= 3 && window.electron?.eliminarVentaOffline) {
          await window.electron.eliminarVentaOffline(venta.offline_id)
        }
      }

      // Error de negocio: seguimos con otros pendientes para evitar bloqueo completo.
      continue
    }
  }

  const pendientesFinales = (await window.electron.obtenerVentasOffline()) || []
  queueState.pending = pendientesFinales.length
  queueState.failed = pendientesFinales.filter((v) => Number(v.fail_count || 0) > 0).length
  queueState.syncing = false
  emitQueueStatus()
}

function ensureSyncListener() {
  if (syncListenerRegistered) return

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      void syncPendingVentas()
    })
  }

  syncListenerRegistered = true
  void syncPendingVentas()
}

async function request(method, url, payload = null, config = {}) {
  ensureSyncListener()

  try {
    const response =
      method === "get" || method === "delete"
        ? await api[method](url, config)
        : await api[method](url, payload, config)

    return ok(response.data)
  } catch (error) {
    if (isNetworkError(error) && canQueueOffline(method, url)) {
      return await queueOfflineVenta(payload)
    }

    return fail(normalizeError(error))
  }
}

export function get(url, config) {
  return request("get", url, null, config)
}

export function post(url, data, config) {
  return request("post", url, data, config)
}

export function put(url, data, config) {
  return request("put", url, data, config)
}

export function del(url, config) {
  return request("delete", url, null, config)
}

export { del as delete }
