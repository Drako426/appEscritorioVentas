import { pool } from "../db/index.js"
import { registrarAuditoria } from "../utils/auditoria.js"
import { eventBus } from "../utils/eventBus.js"
import { EVENTS } from "../utils/events.js"

function asNumber(value) {
  return Number(value || 0)
}

function normalizarCedula(value = "") {
  return String(value).trim()
}

async function obtenerOCrearCliente(client, cedulaRaw, nombreRaw) {
  const cedula = normalizarCedula(cedulaRaw)
  const nombre = String(nombreRaw ?? "").trim()

  if (!cedula) {
    throw new Error("Cedula requerida")
  }

  const existente = await client.query(
    `SELECT id, cedula, nombre FROM clientes WHERE cedula = $1 LIMIT 1`,
    [cedula]
  )

  if (existente.rows.length > 0) {
    const cliente = existente.rows[0]

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

async function obtenerPrestamoActivo(client, prestamoId) {
  const result = await client.query(
    `
    SELECT
      p.id,
      p.cliente_id,
      p.usuario_id,
      p.fecha_prestamo,
      p.estado,
      p.total,
      p.venta_id,
      p.fecha_cierre,
      c.cedula,
      c.nombre AS cliente_nombre
    FROM prestamos p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [prestamoId]
  )

  return result.rows[0] || null
}

export async function crearPrestamo(req, res) {
  const usuario_id = req.user?.id
  const cedula = req.body?.cedula
  const nombre = req.body?.nombre
  const items = Array.isArray(req.body?.items) ? req.body.items : []

  if (!usuario_id) {
    return res.status(401).json({ message: "Usuario no autenticado" })
  }

  if (items.length === 0) {
    return res.status(400).json({ message: "El prestamo debe tener items" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const cliente = await obtenerOCrearCliente(client, cedula, nombre)
    let total = 0
    const itemsResueltos = []

    for (const item of items) {
      const codigo = String(item?.codigo ?? "").trim()
      const talla = String(item?.talla ?? "").trim()
      const cantidad = asNumber(item?.cantidad)
      const precio = asNumber(item?.precio)

      if (!codigo || !talla || cantidad <= 0 || precio <= 0) {
        throw new Error("Item de prestamo invalido")
      }

      const productoRes = await client.query(
        `SELECT id, nombre FROM productos WHERE codigo = $1 LIMIT 1`,
        [codigo]
      )

      if (productoRes.rows.length === 0) {
        throw new Error(`Producto ${codigo} no existe`)
      }

      const producto = productoRes.rows[0]

      const inventarioRes = await client.query(
        `
        SELECT stock_actual
        FROM inventario
        WHERE producto_id = $1 AND talla = $2
        LIMIT 1
        `,
        [producto.id, talla]
      )

      if (inventarioRes.rows.length === 0) {
        throw new Error(`Talla ${talla} no existe para ${codigo}`)
      }

      const stock = asNumber(inventarioRes.rows[0].stock_actual)
      if (stock < cantidad) {
        throw new Error(`Stock insuficiente para ${codigo} talla ${talla}`)
      }

      const subtotal = cantidad * precio
      total += subtotal

      await client.query(
        `
        UPDATE inventario
        SET salidas = salidas + $1,
            stock_actual = stock_actual - $1
        WHERE producto_id = $2
          AND talla = $3
          AND stock_actual >= $1
        `,
        [cantidad, producto.id, talla]
      )

      itemsResueltos.push({
        producto_id: producto.id,
        codigo,
        nombre: producto.nombre,
        talla,
        cantidad,
        precio,
        subtotal
      })
    }

    const prestamoInsert = await client.query(
      `
      INSERT INTO prestamos (cliente_id, usuario_id, fecha_prestamo, estado, total)
      VALUES ($1, $2, NOW(), 'activo', $3)
      RETURNING *
      `,
      [cliente.id, usuario_id, total]
    )

    const prestamo = prestamoInsert.rows[0]

    for (const item of itemsResueltos) {
      await client.query(
        `
        INSERT INTO prestamo_items
        (prestamo_id, producto_id, codigo_producto, nombre_producto, talla, cantidad, precio, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          prestamo.id,
          item.producto_id,
          item.codigo,
          item.nombre,
          item.talla,
          item.cantidad,
          item.precio,
          item.subtotal
        ]
      )
    }

    await client.query("COMMIT")

    await registrarAuditoria({
      usuario_id,
      accion: "PRESTAMO_CREADO",
      entidad: "prestamo",
      entidad_id: prestamo.id,
      metadata: { cliente_id: cliente.id, total, items: itemsResueltos.length }
    })

    return res.status(201).json({
      message: "Prestamo registrado correctamente",
      prestamo: {
        ...prestamo,
        cedula: cliente.cedula,
        cliente_nombre: cliente.nombre
      }
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(error)
    return res.status(400).json({ message: error.message || "Error creando prestamo" })
  } finally {
    client.release()
  }
}

export async function listarPrestamosActivos(req, res) {
  const buscar = String(req.query?.buscar ?? "").trim()

  try {
    const values = []
    let filtro = "WHERE p.estado = 'activo'"

    if (buscar) {
      values.push(`%${buscar}%`)
      filtro += " AND (c.cedula ILIKE $1 OR c.nombre ILIKE $1 OR CAST(p.id AS TEXT) ILIKE $1)"
    }

    const prestamosRes = await pool.query(
      `
      SELECT
        p.id,
        p.fecha_prestamo,
        p.total,
        p.estado,
        c.cedula,
        c.nombre AS cliente_nombre,
        COUNT(pi.id) AS total_items
      FROM prestamos p
      JOIN clientes c ON c.id = p.cliente_id
      JOIN prestamo_items pi ON pi.prestamo_id = p.id
      ${filtro}
      GROUP BY p.id, c.cedula, c.nombre
      ORDER BY p.fecha_prestamo DESC
      `,
      values
    )

    return res.json(prestamosRes.rows)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error obteniendo prestamos" })
  }
}

export async function detallePrestamo(req, res) {
  const id = Number(req.params.id)

  if (!id) {
    return res.status(400).json({ message: "Id invalido" })
  }

  try {
    const prestamo = await obtenerPrestamoActivo(pool, id)
    if (!prestamo) {
      return res.status(404).json({ message: "Prestamo no encontrado" })
    }

    const itemsRes = await pool.query(
      `
      SELECT
        id,
        codigo_producto AS codigo,
        nombre_producto AS nombre,
        talla,
        cantidad,
        precio,
        subtotal
      FROM prestamo_items
      WHERE prestamo_id = $1
      ORDER BY id ASC
      `,
      [id]
    )

    return res.json({ prestamo, items: itemsRes.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Error obteniendo detalle del prestamo" })
  }
}

export async function devolverPrestamo(req, res) {
  const prestamoId = Number(req.params.id)
  const usuario_id = req.user?.id

  if (!prestamoId) {
    return res.status(400).json({ message: "Id invalido" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const prestamo = await obtenerPrestamoActivo(client, prestamoId)
    if (!prestamo) {
      throw new Error("Prestamo no encontrado")
    }

    if (prestamo.estado !== "activo") {
      throw new Error("El prestamo ya fue cerrado")
    }

    const itemsRes = await client.query(
      `
      SELECT producto_id, talla, cantidad
      FROM prestamo_items
      WHERE prestamo_id = $1
      `,
      [prestamoId]
    )

    for (const item of itemsRes.rows) {
      await client.query(
        `
        UPDATE inventario
        SET entradas = entradas + $1,
            stock_actual = stock_actual + $1
        WHERE producto_id = $2 AND talla = $3
        `,
        [asNumber(item.cantidad), item.producto_id, item.talla]
      )
    }

    const cierre = await client.query(
      `
      UPDATE prestamos
      SET estado = 'devuelto', fecha_cierre = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [prestamoId]
    )

    await client.query("COMMIT")

    await registrarAuditoria({
      usuario_id,
      accion: "PRESTAMO_DEVUELTO",
      entidad: "prestamo",
      entidad_id: prestamoId,
      metadata: { total: prestamo.total }
    })

    return res.json({
      message: "Prestamo devuelto correctamente",
      prestamo: cierre.rows[0]
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(error)
    return res.status(400).json({ message: error.message || "Error devolviendo prestamo" })
  } finally {
    client.release()
  }
}

export async function pagarPrestamo(req, res) {
  const prestamoId = Number(req.params.id)
  const usuario_id = req.user?.id
  const efectivo = asNumber(req.body?.efectivo)
  const transferencia = asNumber(req.body?.transferencia)

  if (!prestamoId) {
    return res.status(400).json({ message: "Id invalido" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const prestamo = await obtenerPrestamoActivo(client, prestamoId)
    if (!prestamo) {
      throw new Error("Prestamo no encontrado")
    }

    if (prestamo.estado !== "activo") {
      throw new Error("El prestamo ya fue cerrado")
    }

    const total = asNumber(prestamo.total)
    const totalPagado = efectivo + transferencia
    if (totalPagado < total) {
      throw new Error("Pago insuficiente")
    }

    const sesionActiva = await client.query(
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
      throw new Error("No hay una sesion de caja abierta")
    }

    const sesion_id = sesionActiva.rows[0].id

    const ventaResult = await client.query(
      `
      INSERT INTO ventas
      (usuario_id, sesion_id, fecha, total, efectivo, transferencia, cliente_id, cliente_cedula, cliente_nombre)
      VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        usuario_id,
        sesion_id,
        total,
        efectivo,
        transferencia,
        prestamo.cliente_id,
        prestamo.cedula,
        prestamo.cliente_nombre
      ]
    )

    const venta_id = ventaResult.rows[0].id

    const itemsRes = await client.query(
      `
      SELECT codigo_producto, nombre_producto, talla, cantidad, precio, subtotal
      FROM prestamo_items
      WHERE prestamo_id = $1
      `,
      [prestamoId]
    )

    for (const item of itemsRes.rows) {
      await client.query(
        `
        INSERT INTO detalle_ventas
        (venta_id, codigo_producto, nombre_producto, talla, cantidad, precio, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          venta_id,
          item.codigo_producto,
          item.nombre_producto,
          item.talla,
          item.cantidad,
          item.precio,
          item.subtotal
        ]
      )
    }

    await client.query(
      `
      UPDATE prestamos
      SET estado = 'pagado',
          fecha_cierre = NOW(),
          venta_id = $2
      WHERE id = $1
      `,
      [prestamoId, venta_id]
    )

    await client.query("COMMIT")

    await registrarAuditoria({
      usuario_id,
      accion: "PRESTAMO_PAGADO",
      entidad: "prestamo",
      entidad_id: prestamoId,
      metadata: { venta_id, total }
    })

    await eventBus.emit(EVENTS.VENTA_CREADA, {
      venta_id,
      usuario_id,
      total,
      sesion_id
    })

    return res.json({
      message: "Prestamo pagado correctamente",
      venta_id,
      total,
      cambio: totalPagado - total
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(error)
    return res.status(400).json({ message: error.message || "Error pagando prestamo" })
  } finally {
    client.release()
  }
}
