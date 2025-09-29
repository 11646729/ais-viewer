import { createServer } from "http"

import { connectToAISStream } from "./services/AISService.js"
import { parseAISMessage } from "./services/messageParser.js"
import { initWebSocketServer } from "./services/wsServer.js"

function handlePositionReport(report) {
  // console.log('Received vessel position:', report);
  // TODO: Save to DB here
  parseAISMessage(report)
}

const server = createServer()
const socketAPI = initWebSocketServer(server)
server.listen(8080, () => {
  console.log(server.address())
  console.log("WebSocket server listening on port 8080")
})

connectToAISStream(handlePositionReport)
