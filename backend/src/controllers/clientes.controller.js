import { pool } from "../db/index.js"

function normalizarCedula(cedula = "") {
  return String(cedula).trim()
}

export async function buscarClientePorCedula(req, res) {
  const cedula = normalizarCedula(req.params.cedula)

  if (!cedula) {
    return res.status(400).json({ message: "Cedula requerida" })
  }

  try {
    const result = await pool.query(
      `SELECT id, cedula, nombre FROM clientes WHERE cedula = $1 LIMIT 1`,
      [cedula]
    )

    return res.json(result.rows[0] || null)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error consultando cliente" })
  }
}

export async function buscarClientes(req, res) {
  const buscar = String(req.query.buscar ?? "").trim()

  if (!buscar) return res.json([])

  try {
    const result = await pool.query(
      `
      SELECT id, cedula, nombre
      FROM clientes
      WHERE cedula ILIKE $1 OR nombre ILIKE $1
      ORDER BY nombre ASC
      LIMIT 20
      `,
      [`%${buscar}%`]
    )

    return res.json(result.rows)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error buscando clientes" })
  }
}

export async function upsertCliente(req, res) {
  const cedula = normalizarCedula(req.body?.cedula)
  const nombre = String(req.body?.nombre ?? "").trim()

  if (!cedula) {
    return res.status(400).json({ message: "Cedula requerida" })
  }

  if (!nombre) {
    return res.status(400).json({ message: "Nombre requerido" })
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO clientes (cedula, nombre, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (cedula)
      DO UPDATE SET nombre = EXCLUDED.nombre, updated_at = NOW()
      RETURNING id, cedula, nombre
      `,
      [cedula, nombre]
    )

    return res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error guardando cliente" })
  }
}
