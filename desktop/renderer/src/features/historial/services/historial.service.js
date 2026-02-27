import * as transport from "@/services/transport"

export const getHistorialCierres = async (params = {}) => {
  const result = await transport.get("/historial-cierres", { params })

  if (!result.success) {
    throw new Error(result.error || "Error obteniendo historial")
  }

  return result.data
}

export const getDetalleCierre = async (id) => {
  const result = await transport.get(`/cierre/${id}/ventas`)

  if (!result.success) {
    throw new Error(result.error || "Error obteniendo detalle")
  }

  return result.data
}
