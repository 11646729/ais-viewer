const wsURL = 'ws://10.0.2.2:8080';

import { UserCoordinates } from '@/models/user';
import { Vessel } from '@/models/vessel';
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (coordinates?: UserCoordinates) => {
  const ws = useRef<WebSocket>(undefined);
  const [data, setData] = useState<Vessel[]>([]);
  const userCoordinates = useRef<UserCoordinates>(coordinates);

  useEffect(() => {
    if (coordinates !== undefined) {
      userCoordinates.current = coordinates;
      sendLocationUpdate();
    }
  }, [coordinates]);

  const retryTimeout = useRef<number>(undefined);
  const retryInterval = useRef(1000);
  const maxRetryInterval = 30000;

  const sendLocationUpdate = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'location-update',
        payload: userCoordinates.current
      }
      ws.current.send(JSON.stringify(message))
    }
  }

  const connect = () => {
    ws.current = new WebSocket(wsURL);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected');

      retryInterval.current = 1000;

      if (userCoordinates.current) {
        sendLocationUpdate();
      }
    };

    ws.current.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);

        setData(message);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.current.onerror = (e) => {
      console.log('❌ WebSocket errors', e);
      ws.current?.close();
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
    if (!ws.current) {
      connect();
    }

    return () => {
      clearTimeout(retryTimeout.current);
      if (ws.current) ws.current.close();
    };
  }, []);

  return { data };
};
