// socketServer.js
const WebSocket = require('ws');

const { getNearbyVessels } = require('./queryVessels');

const clients = new Map();

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'location-update') {
          const { latitude, longitude, radius } = data.payload || {};

          if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number'
          ) {
            console.warn('Invalid location update received:', data.payload);
            return;
          }

          const prev = clients.get(ws) || {};

          clients.set(ws, {
            ...prev,
            location: { latitude, longitude },
            radius,
          });

          console.log('Updated client location:', clients.get(ws));
        }
      } catch (e) {
        console.error('Invalid message:', msg);
      }
    });


    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconected')
    });
  });

  setInterval(() => {
    console.log('Connected clients:', clients.size)
    for (const [ws, clientData] of clients.entries()) {
      if (ws.readyState !== WebSocket.OPEN) {
        clients.delete(ws);
        continue;
      }
      const { location, radius } = clientData;

      if (!location) continue;

      const { latitude, longitude } = location;

      getNearbyVessels({ latitude, longitude, radius }).then(vessels => {
        ws.send(JSON.stringify(vessels));
      }).catch(err => {
        console.error('Error sending vessel data:', err);
      });
    }
  }, 10000);
}

module.exports = { initWebSocketServer };
