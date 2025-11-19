// services/messageParser.js
import { query } from "../db.js"

async function parseAISMessage(data) {
  console.log("Parsing AIS message:", data)

  // Early return if no PositionReport - from AI
  const positionReport = data?.Message?.PositionReport
  if (!positionReport) return

  try {
    const { Latitude, Longitude, Sog, Cog, TrueHeading } =
      data.Message.PositionReport

    const { MMSI, ShipName, time_utc } = data.MetaData

    const timestamp = new Date(time_utc).toISOString()

    if (!MMSI || !Latitude || !Longitude || !time_utc) return

    console.log(
      `Vessel MMSI: ${MMSI}, Name: ${ShipName}, Lat: ${Latitude}, Lon: ${Longitude}, SOG: ${Sog}, COG: ${Cog}, Heading: ${TrueHeading}, Time: ${timestamp}`
    )

    //       `
    //   INSERT INTO aisvessels (mmsi, name, latitude, longitude, sog, cog, heading, updated_at, geom)
    //   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($4, $3), 4326))
    //   ON CONFLICT (mmsi) DO UPDATE
    //   SET latitude = EXCLUDED.latitude,
    //       longitude = EXCLUDED.longitude,
    //       sog = EXCLUDED.sog,
    //       cog = EXCLUDED.cog,
    //       heading = EXCLUDED.heading,
    //       updated_at = EXCLUDED.updated_at,
    //       geom = EXCLUDED.geom;
    // `,

    await query(
      `
      INSERT INTO aisvessels (mmsi, name, latitude, longitude, sog, cog, heading, updated_at, geom)
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
