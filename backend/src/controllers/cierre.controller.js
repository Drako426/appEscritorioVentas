import { pool } from "../db/index.js"

export const generarCierre = async (req, res) => {
  const usuario_id = req.user?.id

  if (!usuario_id) {
    return res.status(401).json({ message: "Usuario no autenticado" })
  }

  try {

    // 1️⃣ Obtener último cierre
    const ultimoCierre = await pool.query(`
      SELECT fecha_fin
      FROM cierres
      ORDER BY fecha_fin DESC
      LIMIT 1
    `)

    const fecha_inicio =
      ultimoCierre.rows.length > 0
        ? ultimoCierre.rows[0].fecha_fin
        : "1970-01-01"

    // 2️⃣ Fecha actual del cierre
    const fecha_fin = new Date()

    // 3️⃣ Calcular ventas SOLO desde último cierre
    const ventasResult = await pool.query(
      `
      SELECT 
        COUNT(*) AS cantidad_ventas,
        COALESCE(SUM(total),0) AS total_ventas,
        COALESCE(SUM(efectivo),0) AS total_efectivo,
        COALESCE(SUM(transferencia),0) AS total_transferencia
      FROM ventas
      WHERE fecha > $1
      AND fecha <= $2
      `,
      [fecha_inicio, fecha_fin]
    )

    const resumen = ventasResult.rows[0]

    // 4️⃣ Insertar snapshot
    const cierreInsert = await pool.query(
      `
      INSERT INTO cierres
      (
        fecha_inicio,
        fecha_fin,
        total_ventas,
        total_efectivo,
        total_transferencia,
        cantidad_ventas,
        usuario_id,
        fecha_cierre
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
      `,
      [
        fecha_inicio,
        fecha_fin,
        resumen.total_ventas,
        resumen.total_efectivo,
        resumen.total_transferencia,
        resumen.cantidad_ventas,
        usuario_id
      ]
    )

    res.json({
      message: "Cierre generado correctamente",
      cierre: cierreInsert.rows[0]
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Error generando cierre"
    })
  }
}

export const obtenerVentasDeCierre = async (req, res) => {
  const { id } = req.params

  try {
    // 1️⃣ obtener cierre
    const cierreResult = await pool.query(
      `SELECT * FROM cierres WHERE id = $1`,
      [id]
    )

    if (cierreResult.rows.length === 0) {
      return res.status(404).json({ message: "Cierre no encontrado" })
    }

    const cierre = cierreResult.rows[0]

    // 2️⃣ ventas dentro del rango
    const ventasResult = await pool.query(
      `
      SELECT
        v.fecha,
        dv.nombre_producto,
        dv.talla,
        dv.cantidad,
        dv.precio
      FROM ventas v
      JOIN detalle_ventas dv
        ON dv.venta_id = v.id
      WHERE v.fecha > $1
        AND v.fecha <= $2
      ORDER BY v.fecha ASC
      `,
      [cierre.fecha_inicio, cierre.fecha_fin]
    )

    res.json({
      cierre,
      ventas: ventasResult.rows
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error obteniendo ventas del cierre" })
  }
}