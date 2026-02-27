import express from "express"
import {
  obtenerDashboard,
  obtenerHistorial
} from "../controllers/ventas.controller.js"
import { registrarVenta } from "../controllers/ventas.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.get("/dashboard", authMiddleware, obtenerDashboard)
router.get("/historial", authMiddleware, obtenerHistorial)
router.post("/", authMiddleware, registrarVenta)

export default router
