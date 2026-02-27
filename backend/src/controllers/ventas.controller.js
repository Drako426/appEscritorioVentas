import { pool } from "../db/index.js"
import { registrarAuditoria } from "../utils/auditoria.js"
import { eventBus } from "../utils/eventBus.js"
import { EVENTS } from "../utils/events.js"

async function obtenerOCrearCliente(client, cedulaRaw, nombreRaw) {
  const cedula = String(cedulaRaw ?? "").trim()
  const nombre = String(nombreRaw ?? "").trim()

  if (!cedula) {
    throw new Error("Cedula requerida")
  }

  const clienteExistente = await client.query(
    `SELECT id, cedula, nombre FROM clientes WHERE cedula = $1 LIMIT 1`,
    [cedula]
  )

  if (clienteExistente.rows.length > 0) {
    const cliente = clienteExistente.rows[0]

    if (nombre && nombre !== cliente.nombre) {
      const actualizado = await client.query(
        `UPDATE clientes SET nombre = $1, updated_at = NOW() WHERE id = $2 RETURNING id, cedula, nombre`,
        [nombre, cliente.id]
      )
      return actualizado.rows[0]
    }

    return cliente
  }

  if (!nombre) {
    throw new Error("Nombre requerido para crear cliente")
  }

  const creado = await client.query(
    `INSERT INTO clientes (cedula, nombre, updated_at) VALUES ($1, $2, NOW()) RETURNING id, cedula, nombre`,
    [cedula, nombre]
  )

  return creado.rows[0]
}

export const registrarVenta = async (req, res) => {
  const {
    items,
    efectivo = 0,
    transferencia = 0,
    cliente_cedula,
    cliente_nombre
  } = req.body
  const usuario_id = req.user?.id

  if (!items || items.length === 0) {
    return res.status(400).json({
      message: "Venta sin productos"
    })
  }

  if (!usuario_id) {
    return res.status(400).json({
      message: "Usuario inválido"
    })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const cliente = await obtenerOCrearCliente(client, cliente_cedula, cliente_nombre)
    let totalCalculado = 0

    // ===============================
    // VALIDAR ITEMS
    // ===============================
    for (const item of items) {
      if (!item.codigo || !item.talla || !item.cantidad || !item.precio) {
        throw new Error("Datos incompletos en productos")
      }

      const subtotal = Number(item.precio) * Number(item.cantidad)
      totalCalculado += subtotal
    }

    const totalPagado = Number(efectivo) + Number(transferencia)

    if (totalPagado < totalCalculado) {
      throw new Error("Pago insuficiente")
    }

    // 🔥 obtener sesión activa
    const sesionActiva = await pool.query(
      `
      SELECT id
      FROM sesiones_caja
      WHERE usuario_id = $1
      AND estado = 'abierta'
      LIMIT 1
      `,
      [usuario_id]
    )

    if (sesionActiva.rows.length === 0) {
      return res.status(400).json({
        message: "No hay una sesión de caja abierta"
      })
    }

    const sesion_id = sesionActiva.rows[0].id

    // ===============================
    // INSERTAR VENTA
    // ===============================
    const ventaResult = await client.query(
      `INSERT INTO ventas 
       (usuario_id, sesion_id, fecha, total, efectivo, transferencia, cliente_id, cliente_cedula, cliente_nombre)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        usuario_id,
        sesion_id,
        totalCalculado,
        efectivo,
        transferencia,
        cliente.id,
        cliente.cedula,
        cliente.nombre
      ]
    )

    const venta_id = ventaResult.rows[0].id

    // ===============================
    // PROCESAR PRODUCTOS
    // ===============================
    for (const item of items) {

      // Obtener id y nombre real desde BD
      const productoRes = await client.query(
        "SELECT id, nombre FROM productos WHERE codigo = $1",
        [item.codigo]
      )

      if (productoRes.rows.length === 0) {
        throw new Error(`Producto ${item.codigo} no existe`)
      }

      const producto_id = productoRes.rows[0].id
      const nombreProducto = productoRes.rows[0].nombre

      // Verificar inventario
      const inventarioRes = await client.query(
        `SELECT stock_actual 
         FROM inventario 
         WHERE producto_id = $1 AND talla = $2`,
        [producto_id, item.talla]
      )

      if (inventarioRes.rows.length === 0) {
        throw new Error("Talla no existe")
      }

      const stock = inventarioRes.rows[0].stock_actual

      if (stock < item.cantidad) {
        throw new Error("Stock insuficiente")
      }

      const subtotal = Number(item.precio) * Number(item.cantidad)

      // Insertar detalle usando columnas reales
      await client.query(
        `INSERT INTO detalle_ventas
         (venta_id, codigo_producto, nombre_producto, talla, cantidad, precio, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          venta_id,
          item.codigo,
          nombreProducto,
          item.talla,
          item.cantidad,
          item.precio,
          subtotal
        ]
      )

      // Descontar inventario
      const update = await client.query(
        `UPDATE inventario
         SET 
           salidas = salidas + $1,
           stock_actual = stock_actual - $1
         WHERE producto_id = $2
         AND talla = $3
         AND stock_actual >= $1
         RETURNING stock_actual`,
        [item.cantidad, producto_id, item.talla]
      )

      if (update.rowCount === 0) {
        throw new Error("Stock insuficiente")
      }
    }

    await client.query("COMMIT")

    res.status(201).json({
      message: "Venta registrada correctamente",
      venta_id,
      total: totalCalculado,
      cambio: totalPagado - totalCalculado
    })

    await registrarAuditoria({
      usuario_id,
      accion: "VENTA_CREADA",
      entidad: "venta",
      entidad_id: venta_id,
      metadata: {
        total: totalCalculado,
        items: items.length,
        sesion_id,
        cliente_id: cliente.id
      }
    })

    await eventBus.emit(EVENTS.VENTA_CREADA, {
      venta_id,
      usuario_id,
      total: totalCalculado,
      sesion_id
    })

  } catch (error) {

    await client.query("ROLLBACK")

    console.error("Error registrando venta:", error.message)

    res.status(400).json({
      message: error.message
    })

  } finally {
    client.release()
  }
}


// ===============================
// DASHBOARD
// ===============================
export const obtenerDashboard = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(total),0) AS ventas_hoy
      FROM ventas
      WHERE DATE(fecha)=CURRENT_DATE
    `)

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: "Error dashboard" })
  }
}


// ===============================
// HISTORIAL
// ===============================
export const obtenerHistorial = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM ventas
      ORDER BY fecha DESC
    `)

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: "Error historial" })
  }
}

