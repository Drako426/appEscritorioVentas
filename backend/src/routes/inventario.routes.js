import express from "express"
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js"
import {
  obtenerInventario,
  eliminarInventario,
  actualizarInventario,
  crearInventario
} from "../controllers/inventario.controller.js"

const router = express.Router()

// 🔹 GET inventario (admin y vendedor)
router.get("/", authMiddleware, obtenerInventario)

// 🔹 Crear inventario (solo admin)
router.post("/", authMiddleware, requireRole("admin"), crearInventario)

// 🔹 Actualizar inventario (solo admin)
router.put("/:id", authMiddleware, requireRole("admin"), actualizarInventario)

// 🔹 Eliminar inventario (solo admin)
router.delete("/:id", authMiddleware, requireRole("admin"), eliminarInventario)

export default router
