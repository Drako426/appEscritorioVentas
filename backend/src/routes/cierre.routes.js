import { Router } from "express"
import { generarCierre } from "../controllers/cierre.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { obtenerVentasDeCierre } from "../controllers/cierre.controller.js"

const router = Router()

router.post("/", authMiddleware, generarCierre)
router.get("/:id/ventas", authMiddleware, obtenerVentasDeCierre)

export default router
