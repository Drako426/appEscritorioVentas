import * as transport from "@/services/transport"

export async function crearPrestamo(payload) {
  const result = await transport.post("/prestamos", payload)
  if (!result.success) {
    throw new Error(result.error || "Error creando prestamo")
  }

  return result.data
}

export async function getPrestamosActivos(buscar = "") {
  const result = await transport.get("/prestamos/activos", {
    params: { buscar: String(buscar ?? "").trim() }
  })

  if (!result.success) {
    throw new Error(result.error || "Error obteniendo prestamos")
  }

  return result.data || []
}

export async function getDetallePrestamo(id) {
  const result = await transport.get(`/prestamos/${id}`)
  if (!result.success) {
    throw new Error(result.error || "Error obteniendo detalle")
  }

  return result.data
}

export async function devolverPrestamo(id) {
  const result = await transport.post(`/prestamos/${id}/devolver`, {})
  if (!result.success) {
    throw new Error(result.error || "Error devolviendo prestamo")
  }

  return result.data
}

export async function pagarPrestamo(id, payload) {
  const result = await transport.post(`/prestamos/${id}/pagar`, payload)
  if (!result.success) {
    throw new Error(result.error || "Error pagando prestamo")
  }

  return result.data
}
