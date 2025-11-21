// services/wsServer.js
import { WebSocketServer } from "ws"
import { getNearbyVessels } from "./queryVessels.js"

const clients = new Map()

function initWebSocketServer(server, intervalMs = 10000) {
  const wss = new WebSocketServer({ server })

  wss.on("connection", (ws) => {
    console.log("Client connected")

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg)
        if (data.type === "location-update") {
          const { latitude, longitude, radius } = data.payload || {}

          if (typeof latitude !== "number" || typeof longitude !== "number") {
            const invalidFields = []
            if (typeof latitude !== "number") invalidFields.push("latitude")
            if (typeof longitude !== "number") invalidFields.push("longitude")
            console.warn(
              `Invalid location update received: ${invalidFields.join(
                ", "
              )} is/are missing or not a number. Payload:`,
              data.payload
            )
            return
          }
          const prev = clients.get(ws) || {}

          clients.set(ws, {
            ...prev,
            location: { latitude, longitude },
            radius,
          })

          console.log("Updated client location:", clients.get(ws))
        }
      } catch (e) {
        console.error("Invalid message:", msg)
      }
    })

    ws.on("close", () => {
      clients.delete(ws)
      console.log("Client disconnected")
    })
  })

  setInterval(() => {
    for (const [ws, clientData] of clients.entries()) {
      const { location, radius } = clientData

      if (!location) continue

      const { latitude, longitude } = location

      getNearbyVessels({ latitude, longitude, radius })
        .then((vessels) => {
          try {
            ws.send(JSON.stringify(vessels))
          } catch (sendErr) {
            console.error("Error sending vessel data:", sendErr)
          }
        })
        .catch((err) => {
          console.error("Error sending vessel data:", err)
        })
    }
  }, intervalMs)
}

export { initWebSocketServer }
