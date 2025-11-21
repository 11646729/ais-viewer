import pkg from "pg"
const { Pool } = pkg
import { DB_URI } from "./config.js"

const pool = new Pool({ connectionString: DB_URI })

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection failed", err)
  } else {
    console.log("DB connected:", res.rows[0])
  }
})

const AIS_VESSELS_CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS public.aisvessels (
    mmsi BIGINT PRIMARY KEY,
    name TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    sog DOUBLE PRECISION,
    cog DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    updated_at TIMESTAMPTZ NOT NULL,
    geom GEOMETRY(Point, 4326)
  );
`

async function ensureAisVesselsTable() {
  try {
    const { rows } = await pool.query(
      "SELECT to_regclass('public.aisvessels') AS table_id;"
    )

    if (!rows?.[0]?.table_id) {
      try {
        await pool.query("CREATE EXTENSION IF NOT EXISTS postgis;")
      } catch (extErr) {
        console.warn(
          "PostGIS extension could not be ensured; geom column may fail",
          extErr?.message || extErr
        )
      }

      await pool.query(AIS_VESSELS_CREATE_SQL)
      console.log("Created aisvessels table")
    }
  } catch (err) {
    console.error("Failed to verify aisvessels table", err)
  }
}

ensureAisVesselsTable().catch((err) => {
  console.error("Error during aisvessels bootstrap", err)
})

async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // console.log("executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (err) {
    console.error("query error", { text, err })
    throw err
  }
}

export { query, pool }
