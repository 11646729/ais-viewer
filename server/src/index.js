// =============================================================
// index.js
// =============================================================
import { createServer } from "http"

import { connectToAISStream } from "./services/AISService.js"
import { parseAISMessage } from "./services/messageParser.js"
import { initWebSocketServer } from "./services/wsServer.js"

const PORT = 8080

const handlePositionReport = (report) => {
  if (!report) return

  // Uncomment the line below to check if data is being received
  // console.log(
  //   "Received vessel position:",
  //   report.MetaData?.ShipName + " " + report.MetaData?.time_utc
  // )

  // Save to DB here
  parseAISMessage(report)
}

const server = createServer()
initWebSocketServer(server)

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`)
})

connectToAISStream(handlePositionReport)
