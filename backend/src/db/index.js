import pkg from "pg"

const { Pool } = pkg

const ssl =
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false

const databaseUrl = process.env.DATABASE_URL?.trim()

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ssl
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: String(process.env.DB_PASSWORD ?? ""),
      port: Number(process.env.DB_PORT) || 5432,
      ssl
    }

export const pool = new Pool(poolConfig)

pool.connect()
  .then(() => console.log("PostgreSQL conectado"))
  .catch((err) => console.error("Error DB:", err))
