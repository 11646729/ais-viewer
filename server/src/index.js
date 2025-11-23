import { createServer } from "http"

import { connectToAISStream } from "./services/AISService.js"
import { parseAISMessage } from "./services/messageParser.js"
import { initWebSocketServer } from "./services/wsServer.js"

function handlePositionReport(report) {
  // Uncomment the line below to check if data is being received
  console.log(
    "Received vessel position:",
    report.MetaData?.ShipName + " " + report.MetaData?.time_utc
  )

  // Save to DB here
  parseAISMessage(report)
}

const server = createServer()
const socketAPI = initWebSocketServer(server)

server.listen(8080, () => {
  console.log(server.address())
  console.log("WebSocket server listening on port 8080")
})

connectToAISStream(handlePositionReport)
