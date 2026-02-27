import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { getDashboard } from "../controllers/dashboard.controller.js"

const router = express.Router()

// ✅ Endpoint dashboard
router.get("/", authMiddleware, getDashboard)

export default router