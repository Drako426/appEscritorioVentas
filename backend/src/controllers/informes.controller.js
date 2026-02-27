import { pool } from "../db/index.js"

export const getInformeGeneral = async (req, res) => {
  const { desde, hasta } = req.query

  try {

    // ===============================
    // RESUMEN GENERAL
    // ===============================
    const resumen = await pool.query(
      `
      SELECT
        COUNT(*) AS cantidad_ventas,
        COALESCE(SUM(total),0) AS total_ventas,
        COALESCE(SUM(efectivo),0) AS total_efectivo,
        COALESCE(SUM(transferencia),0) AS total_transferencia
      FROM ventas
      WHERE fecha BETWEEN $1 AND $2
      `,
      [desde, hasta]
    )

    // ===============================
    // PRODUCTOS MÁS VENDIDOS
    // ===============================
    const productos = await pool.query(
      `
      SELECT
        nombre_producto,
        talla,
        SUM(cantidad) AS total_vendidos,
        SUM(subtotal) AS total_dinero
      FROM detalle_ventas dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE v.fecha BETWEEN $1 AND $2
      GROUP BY nombre_producto, talla
      ORDER BY total_vendidos DESC
      LIMIT 10
      `,
      [desde, hasta]
    )

    res.json({
      resumen: resumen.rows[0],
      productos: productos.rows
    })

  } catch (error) {
    console.error("Error informes:", error)
    res.status(500).json({
      message: "Error generando informe"
    })
  }
}