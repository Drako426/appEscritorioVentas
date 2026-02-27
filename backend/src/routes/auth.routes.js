import express from "express"
import { login, verifyPassword } from "../controllers/auth.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.post("/login", login)
router.post("/verify-password", authMiddleware, verifyPassword)

export default router
