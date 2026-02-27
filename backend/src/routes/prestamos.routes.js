import { Router } from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import {
  crearPrestamo,
  listarPrestamosActivos,
  detallePrestamo,
  devolverPrestamo,
  pagarPrestamo
} from "../controllers/prestamos.controller.js"

const router = Router()

router.get("/activos", authMiddleware, listarPrestamosActivos)
router.get("/:id", authMiddleware, detallePrestamo)
router.post("/", authMiddleware, crearPrestamo)
router.post("/:id/devolver", authMiddleware, devolverPrestamo)
router.post("/:id/pagar", authMiddleware, pagarPrestamo)

export default router
