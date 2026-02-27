import { pool } from "../db/index.js"
import jwt from "jsonwebtoken"

export const login = async (req, res) => {
  const { usuario, password } = req.body

  if (!usuario || !password) {
    return res.status(400).json({ message: "Datos incompletos" })
  }

  try {
    const result = await pool.query(
      "SELECT id, usuario, password, rol FROM usuarios WHERE usuario = $1",
      [usuario]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Usuario no existe" })
    }

    const user = result.rows[0]

    if (user.password !== password) {
      return res.status(401).json({ message: "Contraseña incorrecta" })
    }

    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    )

    return res.json({
      id: user.id,
      usuario: user.usuario,
      rol: user.rol,
      token
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error servidor" })
  }
}

export const verifyPassword = async (req, res) => {
  const userId = req.user?.id
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ message: "ContraseÃ±a requerida" })
  }

  try {
    const result = await pool.query(
      "SELECT password FROM usuarios WHERE id = $1",
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    if (result.rows[0].password !== password) {
      return res.status(401).json({ message: "ContraseÃ±a incorrecta" })
    }

    return res.json({ ok: true })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error servidor" })
  }
}
