import { pool } from "../db/index.js"

export const getDashboard = async (req, res) => {
  try {

    // ===== Ventas hoy =====
    const hoy = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ventas_hoy
      FROM ventas
      WHERE DATE(fecha) = CURRENT_DATE
    `)

    // ===== Ventas mes =====
    const mes = await pool.query(`
      SELECT 
        COUNT(*) AS ventas_mes,
        COALESCE(SUM(total),0) AS venta_mes
      FROM ventas
      WHERE DATE_TRUNC('month', fecha)
            = DATE_TRUNC('month', CURRENT_DATE)
    `)

    res.json({
      venta_hoy: hoy.rows[0].ventas_hoy,
      venta_mes: mes.rows[0].venta_mes,
      ventas_mes: mes.rows[0].ventas_mes
    })

  } catch (error) {
    console.error("ERROR DASHBOARD:", error)
    res.status(500).json({ message: "Error cargando dashboard" })
  }
}