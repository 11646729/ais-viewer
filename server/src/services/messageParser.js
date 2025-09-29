// services/messageParser.js
import { query } from "../db.js"

async function parseAISMessage(data) {
  try {
    const { Latitude, Longitude, Sog, Cog, TrueHeading } =
      data.Message.PositionReport

    const { MMSI, ShipName, time_utc } = data.MetaData

    const timestamp = new Date(time_utc).toISOString()

    if (!MMSI || !Latitude || !Longitude || !time_utc) return

    await query(
      `
      INSERT INTO vessels (mmsi, name, latitude, longitude, sog, cog, heading, updated_at, geom)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($4, $3), 4326))
      ON CONFLICT (mmsi) DO UPDATE
      SET latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          sog = EXCLUDED.sog,
          cog = EXCLUDED.cog,
          heading = EXCLUDED.heading,
          updated_at = EXCLUDED.updated_at,
          geom = EXCLUDED.geom;
    `,
      [MMSI, ShipName, Latitude, Longitude, Sog, Cog, TrueHeading, timestamp]
    )
  } catch (err) {
    console.error("Failed to parse AIS message:", err)
  }
}

export { parseAISMessage }
