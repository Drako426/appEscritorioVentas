import { dbPromise } from "./db"

export async function guardarInventarioCache(data) {
  const db = await dbPromise
  await db.put("inventario_cache", data, "data")
}

export async function obtenerInventarioCache() {
  const db = await dbPromise
  return await db.get("inventario_cache", "data")
}
