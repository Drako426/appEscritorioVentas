import * as transport from "@/services/transport"
import {
  guardarInventarioCache,
  obtenerInventarioCache
} from "@/offline/inventarioCache"

export const getInventario = async () => {
  const result = await transport.get("/inventario")

  if (result.success) {
    await guardarInventarioCache(result.data || [])
    return result.data || []
  }

  const cache = await obtenerInventarioCache()
  return cache || []
}

export const updateInventario = async (id, data) => {
  const result = await transport.put(`/inventario/${id}`, data)

  if (!result.success) {
    throw new Error(result.error || "Error actualizando inventario")
  }

  return result.data
}

export const deleteInventario = async (id) => {
  const result = await transport.delete(`/inventario/${id}`)

  if (!result.success) {
    throw new Error(result.error || "Error eliminando inventario")
  }
}

export const createInventario = async (data) => {
  const result = await transport.post("/inventario", data)

  if (!result.success) {
    throw new Error(result.error || "Error creando inventario")
  }

  return result.data
}

export const uploadInventarioExcel = async (file) => {
  const formData = new FormData()
  formData.append("file", file)

  const result = await transport.post("/upload/inventario", formData)

  if (!result.success) {
    throw new Error(result.error || "Error subiendo inventario")
  }

  return result.data
}
