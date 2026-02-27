import * as transport from "@/services/transport"

export async function buscarClientePorCedula(cedula) {
  const value = String(cedula ?? "").trim()
  if (!value) return null

  const result = await transport.get(`/clientes/${encodeURIComponent(value)}`)
  if (!result.success) {
    throw new Error(result.error || "Error consultando cliente")
  }

  return result.data
}

export async function buscarClientes(buscar) {
  const value = String(buscar ?? "").trim()
  if (!value) return []

  const result = await transport.get("/clientes", { params: { buscar: value } })
  if (!result.success) {
    throw new Error(result.error || "Error buscando clientes")
  }

  return result.data || []
}

export async function upsertCliente({ cedula, nombre }) {
  const result = await transport.post("/clientes/upsert", { cedula, nombre })
  if (!result.success) {
    throw new Error(result.error || "Error guardando cliente")
  }

  return result.data
}
