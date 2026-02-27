import { pool } from '../db/index.js'

export const getHistorialCierres = async (req, res) => {
  try {

    const query = `
      SELECT
        c.id,
        c.fecha_inicio,
        c.fecha_fin,
        c.total_ventas,
        c.total_efectivo,
        c.total_transferencia,
        c.cantidad_ventas,
        c.fecha_cierre,
        u.usuario AS usuario
      FROM cierres c
      JOIN usuarios u ON u.id = c.usuario_id
      ORDER BY c.fecha_cierre DESC
    `

    const { rows } = await pool.query(query)

    res.json(rows)

  } catch (error) {
    console.error("❌ Error historial cierres:", error)
    res.status(500).json({
      message: "Error obteniendo historial de cierres"
    })
  }
}