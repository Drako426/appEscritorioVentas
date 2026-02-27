import express from "express"
import multer from "multer"
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js"

const router = express.Router()

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {

    const allowed =
      file.mimetype.includes("spreadsheet") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")

    if (!allowed) {
      return cb(new Error("Solo archivos Excel"))
    }

    cb(null, true)
  }
})

router.post("/inventario", authMiddleware, requireRole("admin"), upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" })
    }

    // aquí luego procesaremos excel
    res.json({ message: "Archivo recibido correctamente" })

  } catch (error) {
    res.status(500).json({ message: "Error subiendo archivo" })
  }
})

export default router
