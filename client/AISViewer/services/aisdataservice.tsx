import { Alert } from 'react-native';

const wsURL = 'ws://10.0.2.2:8080';

import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (coordinates?: { latitude: number, longitude: number, radius: number }) => {
  const ws = useRef<WebSocket>(undefined);
  const [data, setData] = useState<Array<any>>([]);

  useEffect(() => {
    if (coordinates) {
      sendMessage();
    }

  }, [coordinates])

  const retryTimeout = useRef<number>(undefined);
  const retryInterval = useRef(1000);
  const maxRetryInterval = 30000;

  const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'location-update',
        payload: coordinates
      }
      ws.current.send(JSON.stringify(message))
    }
  }

  const connect = () => {
    ws.current = new WebSocket(wsURL);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected');
      sendMessage();
      retryInterval.current = 1000;
    };

    ws.current.onmessage = (e) => {
      try {
        console.log(e.data)
        const message = JSON.parse(e.data);
        
        setData(message);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.current.onerror = (e) => {
      console.log('❌ WebSocket errors', e);
      ws.current?.close();
      scheduleReconnect();
    };

    ws.current.onclose = (e) => {
      console.log('🔁 WebSocket closed. Attempting reconnect in', retryInterval.current, 'ms');
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    clearTimeout(retryTimeout.current);

    retryTimeout.current = setTimeout(() => {
      retryInterval.current = Math.min(retryInterval.current * 2, maxRetryInterval);
      connect();
    }, retryInterval.current);

  };

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(retryTimeout.current);
      if (ws.current) ws.current.close();
    };
  }, []);

  return { data };
};
