import { openDB } from "idb"

export const dbPromise = openDB("tienda-db", 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("inventario")) {
      db.createObjectStore("inventario", { keyPath: "id" })
    }

    if (!db.objectStoreNames.contains("inventario_cache")) {
      db.createObjectStore("inventario_cache")
    }

    if (!db.objectStoreNames.contains("ventas_pendientes")) {
      db.createObjectStore("ventas_pendientes", {
        keyPath: "localId",
        autoIncrement: true
      })
    }
  }
})
