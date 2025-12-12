import { execSync } from "child_process"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

// Load .env manually
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, "..", ".env")
if (fs.existsSync(envPath)) {
  const dotenv = await import("dotenv")
  dotenv.config({ path: envPath })
}

// Accept --uri argument to target a specific database
const argUriIdx = process.argv.findIndex((a) => a === "--uri")
let argUri = argUriIdx !== -1 ? process.argv[argUriIdx + 1] : undefined
// If the arg is an env placeholder like $NEW_DB_URI, resolve it
if (argUri && argUri.startsWith("$")) {
  const envName = argUri.slice(1)
  if (process.env[envName]) {
    argUri = process.env[envName]
  }
}

const dbUri = argUri || process.env.NEW_DB_URI || process.env.DB_URI
if (!dbUri) {
  console.error("DB_URI is not set. Please define it in server/.env.")
  process.exit(1)
}

const sqlPath = path.join(__dirname, "..", "src", "sql", "enable_postgis.sql")
if (!fs.existsSync(sqlPath)) {
  console.error("SQL file not found:", sqlPath)
  process.exit(1)
}

try {
  console.log("Enabling PostGIS on:", dbUri)
  execSync(`psql "${dbUri}" -f "${sqlPath}"`, { stdio: "inherit" })
  console.log("PostGIS enable script completed.")
} catch (err) {
  console.error("Failed to enable PostGIS:", err?.message || err)
  process.exit(2)
}
