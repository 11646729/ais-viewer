// services/queryVessels.js
import { query } from "../db.js"

async function getNearbyVessels({ latitude, longitude, radius }) {
  try {
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof radius !== "number"
    ) {
      return
    }

    const result = await query(
      `
      SELECT 
        mmsi,
        name,
        heading,
        sog,
        cog,
        updated_at,
        latitude,
        longitude,
        ST_AsGeoJSON(geom)::json AS geometry
        FROM vessels
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      );
      `,
      [longitude, latitude, radius]
    )

    return result.rows
  } catch (err) {
    console.error("Failed to fetch vessels:", err)
  }
}

export { getNearbyVessels }
