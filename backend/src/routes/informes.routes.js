import { Router } from "express"
import { getInformeGeneral } from "../controllers/informes.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/", authMiddleware, getInformeGeneral)

export default router