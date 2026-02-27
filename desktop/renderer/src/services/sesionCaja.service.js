import * as transport from "@/services/transport"

export const obtenerSesionActiva = async () => {
  const result = await transport.get("/sesion-caja/activa")

  if (!result.success) {
    throw new Error(result.error || "Error obteniendo sesion activa")
  }

  return result.data
}

export const abrirSesionCaja = async (monto = 0) => {
  const sesionActiva = await obtenerSesionActiva()

  if (sesionActiva) {
    return sesionActiva
  }

  const result = await transport.post("/sesion-caja/abrir", {
    monto_apertura: monto
  })

  if (!result.success) {
    throw new Error(result.error || "Error abriendo sesion de caja")
  }

  return result.data
}

export const cerrarSesionCaja = async () => {
  const result = await transport.post("/sesion-caja/cerrar", {})

  if (!result.success) {
    throw new Error(result.error || "Error cerrando sesion de caja")
  }

  return result.data
}
