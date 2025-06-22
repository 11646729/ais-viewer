const http = require('http');

const { connectToAISStream } = require('./services/AISService');
const { parseAISMessage } = require('./services/messageParser');
const { initWebSocketServer } = require('./services/wsServer');

function handlePositionReport(report) {
  // console.log('Received vessel position:', report);
  // TODO: Save to DB here
  parseAISMessage(report);
}

const server = http.createServer();
const socketAPI = initWebSocketServer(server);
server.listen(8080, () => {
  console.log(server.address())
  console.log('WebSocket server listening on port 8080');
});

connectToAISStream(handlePositionReport);