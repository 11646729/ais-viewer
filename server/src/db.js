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

async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res
  } catch (err) {
    console.error("query error", { text, err })
    throw err
  }
}

export { query, pool }
