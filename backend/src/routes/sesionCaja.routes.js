import { Router } from "express"
import {
  abrirSesionCaja,
  obtenerSesionActiva,
  cerrarSesionCaja
} from "../controllers/sesionCaja.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/abrir", authMiddleware, abrirSesionCaja)
router.get("/activa", authMiddleware, obtenerSesionActiva)
router.post("/cerrar", authMiddleware, cerrarSesionCaja)

export default router
