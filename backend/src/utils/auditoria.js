import { pool } from "../db/index.js"

export const registrarAuditoria = async ({
  usuario_id,
  accion,
  entidad = null,
  entidad_id = null,
  metadata = {}
}) => {
  try {
    await pool.query(
      `
      INSERT INTO auditoria
      (usuario_id, accion, entidad, entidad_id, metadata)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [usuario_id, accion, entidad, entidad_id, metadata]
    )
  } catch (error) {
    console.error("Error auditoria:", error.message)
  }
}