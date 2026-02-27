import { Router } from 'express'
import { getHistorialCierres } from '../controllers/historialCierres.controller.js'
import {authMiddleware} from '../middlewares/auth.middleware.js'

const router = Router()

// GET /api/historial-cierres
router.get('/', authMiddleware, getHistorialCierres)

export default router