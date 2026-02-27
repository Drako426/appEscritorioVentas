import { pool } from "./index.js"

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      cedula VARCHAR(30) UNIQUE NOT NULL,
      nombre VARCHAR(180) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    ALTER TABLE ventas
    ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id)
  `)

  await pool.query(`
    ALTER TABLE ventas
    ADD COLUMN IF NOT EXISTS cliente_cedula VARCHAR(30)
  `)

  await pool.query(`
    ALTER TABLE ventas
    ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(180)
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prestamos (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id),
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      fecha_prestamo TIMESTAMP NOT NULL DEFAULT NOW(),
      estado VARCHAR(20) NOT NULL DEFAULT 'activo',
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      venta_id INTEGER REFERENCES ventas(id),
      fecha_cierre TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prestamo_items (
      id SERIAL PRIMARY KEY,
      prestamo_id INTEGER NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      codigo_producto VARCHAR(60) NOT NULL,
      nombre_producto VARCHAR(180) NOT NULL,
      talla VARCHAR(20) NOT NULL,
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      precio NUMERIC(12,2) NOT NULL CHECK (precio > 0),
      subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
    )
  `)
}
