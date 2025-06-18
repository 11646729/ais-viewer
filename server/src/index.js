const { connectToAISStream } = require('./services/AISService');
const { parseAISMessage } = require('./services/messageParser');

function handlePositionReport(report) {
  console.log('Received vessel position:', report);
  // TODO: Save to DB here
  parseAISMessage(report);
}

connectToAISStream(handlePositionReport);