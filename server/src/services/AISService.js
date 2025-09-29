import WebSocket from "ws"
import { AIS_API_KEY } from "../config.js"

let socket

function connectToAISStream(onMessage) {
  socket = new WebSocket("wss://stream.aisstream.io/v0/stream", {
    headers: {
      Authorization: `Bearer ${AIS_API_KEY}`,
    },
  })

  socket.onopen = function (_) {
    let subscriptionMessage = {
      Apikey: AIS_API_KEY,
      BoundingBoxes: [
        [
          [-90, -180],
          [90, 180],
        ],
      ],
      FilterMessageTypes: ["PositionReport"],
    }
    socket.send(JSON.stringify(subscriptionMessage))
  }

  socket.onmessage = function (event) {
    let aisMessage = JSON.parse(event.data)
    onMessage(aisMessage)
  }

  socket.on("error", (err) => {
    console.error("[AIS] WebSocket error:", err)
  })

  socket.on("close", () => {
    console.warn("[AIS] WebSocket closed. Reconnecting in 5s...")
    setTimeout(() => connectToAISStream(onMessage), 5000)
  })
}

export { connectToAISStream }
