import { pool } from "../db/index.js"

/**
 * GET /inventario
 */
export const obtenerInventario = async (req, res) => {
  try {
    const { buscar } = req.query

    let query = `
      SELECT 
        i.id,
        p.codigo,
        p.nombre,
        i.talla,
        i.entradas,
        i.salidas,
        i.stock_actual,
        p.precio_costo
      FROM inventario i
      JOIN productos p ON p.id = i.producto_id
      WHERE 1=1
    `

    const values = []

    if (buscar) {
      query += `
        AND (
          p.codigo ILIKE $1
          OR p.nombre ILIKE $1
          OR CAST(i.talla AS TEXT) ILIKE $1
        )
      `
      values.push(`%${buscar}%`)
    }

    query += ` ORDER BY p.nombre ASC, i.talla ASC`

    const result = await pool.query(query, values)

    res.json(result.rows)

  } catch (error) {
    console.error("Error obteniendo inventario:", error)
    res.status(500).json({ message: "Error obteniendo inventario" })
  }
}

/**
 * DELETE
 */
export const eliminarInventario = async (req, res) => {
  const { id } = req.params

  try {
    await pool.query("DELETE FROM inventario WHERE id = $1", [id])
    res.json({ message: "Eliminado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al eliminar" })
  }
}

/**
 * PUT
 */
export const actualizarInventario = async (req, res) => {
  const { id } = req.params
  const { codigo, nombre, talla, entradas, precio_costo } = req.body

  try {
    const invActual = await pool.query(
      `SELECT producto_id, salidas, entradas
       FROM inventario
       WHERE id = $1`,
      [id]
    )

    if (invActual.rows.length === 0) {
      return res.status(404).json({ message: "Registro no encontrado" })
    }

    const { producto_id, salidas } = invActual.rows[0]
    const stockActualDB = await pool.query(
      `SELECT stock_actual FROM inventario WHERE id = $1`,
      [id]
    )

    const stockAnterior = stockActualDB.rows[0].stock_actual

    // diferencia real de entradas
    const diferenciaEntradas = entradas - invActual.rows[0].entradas

    const nuevoStock = stockAnterior + diferenciaEntradas

    await pool.query(
      `UPDATE inventario
       SET talla = $1,
           entradas = $2,
           stock_actual = $3
       WHERE id = $4`,
      [talla, entradas, nuevoStock, id]
    )

    await pool.query(
      `UPDATE productos
       SET codigo = $1,
           nombre = $2,
           precio_costo = $3
       WHERE id = $4`,
      [codigo, nombre, precio_costo, producto_id]
    )

    res.json({ message: "Actualizado correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error actualizando inventario" })
  }
}

/**
 * POST
 */
export const crearInventario = async (req, res) => {
  const { codigo, nombre, talla, entradas, precio_costo } = req.body

  try {
    await pool.query("BEGIN")

    const productoExistente = await pool.query(
      "SELECT id FROM productos WHERE codigo = $1",
      [codigo]
    )

    let productoId

    if (productoExistente.rows.length > 0) {
      productoId = productoExistente.rows[0].id

      await pool.query(
        `UPDATE productos
         SET nombre = $1,
             precio_costo = $2
         WHERE id = $3`,
        [nombre, precio_costo, productoId]
      )

    } else {
      const nuevoProducto = await pool.query(
        `INSERT INTO productos (codigo, nombre, precio_costo)
         VALUES ($1,$2,$3)
         RETURNING id`,
        [codigo, nombre, precio_costo]
      )

      productoId = nuevoProducto.rows[0].id
    }

    await pool.query(
      `INSERT INTO inventario
       (producto_id, talla, entradas, salidas, stock_actual)
       VALUES ($1,$2,$3,0,$3)`,
      [productoId, talla, entradas]
    )

    await pool.query("COMMIT")

    res.json({ message: "Producto creado correctamente" })

  } catch (error) {
    await pool.query("ROLLBACK")
    console.error(error)
    res.status(500).json({ message: "Error creando inventario" })
  }
}
