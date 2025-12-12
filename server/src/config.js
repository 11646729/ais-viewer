import dotenv from "dotenv"
dotenv.config()

export const AIS_API_KEY = process.env.AIS_API_KEY
export const DB_URI = process.env.NEW_DB_URI
export const PORT = process.env.PORT || 3000
