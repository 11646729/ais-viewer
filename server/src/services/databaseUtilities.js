import pg from "pg"

const DEFAULT_DB_URL = process.env.DB_URI

let sharedPool = null

function ensurePool(url = DEFAULT_DB_URL) {
  if (!url) {
    throw new Error("No PostgreSQL connection string provided")
  }

  if (!sharedPool) {
    sharedPool = new pg.Pool({ connectionString: url })
    sharedPool.on("error", (err) => {
      console.error("Unexpected PostgreSQL error:", err)
    })
  }

  return sharedPool
}

function convertPlaceholders(sql) {
  let index = 1
  return sql.replace(/\?/g, () => `$${index++}`)
}

class DatabaseAdapter {
  constructor(pool = ensurePool()) {
    this.pool = pool
  }

  async run(sql, params = [], callback) {
    const execute = async () => {
      const result = await this.pool.query(
        convertPlaceholders(sql),
        params ?? []
      )
      const info = {
        lastID: result.rows?.[0]?.id ?? null,
        changes: result.rowCount ?? 0,
      }
      return info
    }

    if (!callback) return execute()

    try {
      const info = await execute()
      callback.call(info, null)
    } catch (err) {
      callback(err)
    }
  }

  async all(sql, params = [], callback) {
    const execute = async () => {
      const result = await this.pool.query(
        convertPlaceholders(sql),
        params ?? []
      )
      return result.rows
    }

    if (!callback) return execute()

    try {
      const rows = await execute()
      callback(null, rows)
    } catch (err) {
      callback(err, null)
    }
  }

  async get(sql, params = [], callback) {
    const execute = async () => {
      const result = await this.pool.query(
        convertPlaceholders(sql),
        params ?? []
      )
      return result.rows[0] ?? null
    }

    if (!callback) return execute()

    try {
      const row = await execute()
      callback(null, row)
    } catch (err) {
      callback(err, null)
    }
  }

  async close() {
    // Shared pool remains open; no per-adapter close action.
  }
}

export const openSqlDbConnection = async (url = DEFAULT_DB_URL) => {
  try {
    const pool = ensurePool(url)
    await pool.query("SELECT 1")
    return new DatabaseAdapter(pool)
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err?.message || err)
    return null
  }
}

export const closeSqlDbConnection = async () => {
  if (sharedPool) {
    await sharedPool.end()
    sharedPool = null
  }
}

export { DatabaseAdapter }
export const createDatabaseAdapter = async () => openSqlDbConnection()
