import { Router } from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import {
  buscarClientePorCedula,
  buscarClientes,
  upsertCliente
} from "../controllers/clientes.controller.js"

const router = Router()

router.get("/", authMiddleware, buscarClientes)
router.get("/:cedula", authMiddleware, buscarClientePorCedula)
router.post("/upsert", authMiddleware, upsertCliente)

export default router
