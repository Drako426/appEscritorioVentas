import { pool } from "../db/index.js"
import { registrarAuditoria } from "../utils/auditoria.js"

/**
 * ==========================
 * ABRIR SESIÓN DE CAJA
 * ==========================
 */
export const abrirSesionCaja = async (req, res) => {
  const usuario_id = req.user?.id
  const { monto_apertura = 0 } = req.body

  try {

    // verificar sesión abierta
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

    if (sesionActiva.rows.length > 0) {
      return res.status(400).json({
        message: "Ya existe una sesión abierta"
      })
    }

    // crear sesión
    const nuevaSesion = await pool.query(
      `
      INSERT INTO sesiones_caja
      (usuario_id, monto_apertura, fecha_apertura, estado)
      VALUES ($1, $2, NOW(), 'abierta')
      RETURNING *
      `,
      [usuario_id, monto_apertura]
    )

    const sesion = nuevaSesion.rows[0]

    // auditoría
    await registrarAuditoria({
      usuario_id,
      accion: "CAJA_ABIERTA",
      entidad: "sesion_caja",
      entidad_id: sesion.id,
      metadata: { monto_apertura }
    })

    return res.json(sesion)

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Error abriendo sesión"
    })
  }
}


/**
 * ==========================
 * OBTENER SESIÓN ACTIVA
 * ==========================
 */
export const obtenerSesionActiva = async (req, res) => {
  const usuario_id = req.user?.id

  try {

    const result = await pool.query(
      `
      SELECT *
      FROM sesiones_caja
      WHERE usuario_id = $1
      AND estado = 'abierta'
      LIMIT 1
      `,
      [usuario_id]
    )

    return res.json(result.rows[0] || null)

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Error obteniendo sesión"
    })
  }
}

/**
 * ==========================
 * CERRAR SESION DE CAJA
 * ==========================
 */
export const cerrarSesionCaja = async (req, res) => {
  const usuario_id = req.user?.id

  try {
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
        message: "No hay una sesion de caja abierta"
      })
    }

    const sesion_id = sesionActiva.rows[0].id

    const sesionCerrada = await pool.query(
      `
      UPDATE sesiones_caja
      SET estado = 'cerrada'
      WHERE id = $1
      RETURNING *
      `,
      [sesion_id]
    )

    await registrarAuditoria({
      usuario_id,
      accion: "CAJA_CERRADA",
      entidad: "sesion_caja",
      entidad_id: sesion_id,
      metadata: {}
    })

    return res.json(sesionCerrada.rows[0])
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Error cerrando sesion"
    })
  }
}
