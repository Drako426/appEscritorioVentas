import express from "express"
import cors from "cors"
import { ensureSchema } from "./db/bootstrap.js"

import ventasRoutes from "./routes/ventas.routes.js"
import inventarioRoutes from "./routes/inventario.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import historialCierresRoutes from "./routes/historialCierres.routes.js"
import authRoutes from "./routes/auth.routes.js"
import uploadRoutes from "./routes/upload.routes.js"
import cierreRoutes from "./routes/cierre.routes.js"
import sesionCajaRoutes from "./routes/sesionCaja.routes.js"
import informesRoutes from "./routes/informes.routes.js"
import clientesRoutes from "./routes/clientes.routes.js"
import prestamosRoutes from "./routes/prestamos.routes.js"
import "./listeners/venta.listener.js"

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)

    const allowed = ["http://localhost:5173"]
    if (allowed.includes(origin)) return cb(null, true)

    return cb(new Error("Origen no permitido por CORS"), false)
  },
  credentials: true
}))

app.use(express.json())

app.use("/api/ventas", ventasRoutes)
app.use("/api/inventario", inventarioRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/historial-cierres", historialCierresRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/cierre", cierreRoutes)
app.use("/api/sesion-caja", sesionCajaRoutes)
app.use("/api/informes", informesRoutes)
app.use("/api/clientes", clientesRoutes)
app.use("/api/prestamos", prestamosRoutes)

app.get("/", (req, res) => {
  res.send("API funcionando correctamente")
})

app.use((err, req, res, next) => {
  if (err?.message?.includes("CORS")) {
    return res.status(403).json({ message: "Origen no permitido" })
  }

  console.error(err.stack)
  res.status(500).json({ message: "Error interno del servidor" })
})

async function startServer() {
  await ensureSchema()

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
  })
}

startServer().catch((error) => {
  console.error("No se pudo iniciar el servidor:", error)
  process.exit(1)
})
