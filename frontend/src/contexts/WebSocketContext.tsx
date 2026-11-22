import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  liveNotifications: any[];
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  liveNotifications: [],
  clearNotifications: () => {},
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let pingInterval: any;
    let reconnectTimeout: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          // Heartbeat ping
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);

            if (data.type === 'NEW_ALERT') {
              setLiveNotifications((prev) => [
                {
                  id: Date.now(),
                  type: 'alert',
                  title: data.data.title,
                  severity: data.data.severity,
                  timestamp: new Date().toLocaleTimeString(),
                },
                ...prev.slice(0, 19),
              ]);
            } else if (data.type === 'RESPONSE_ACTION') {
              setLiveNotifications((prev) => [
                {
                  id: Date.now(),
                  type: 'response',
                  title: `Action: ${data.data.action_type}`,
                  target: data.data.target,
                  timestamp: new Date().toLocaleTimeString(),
                },
                ...prev.slice(0, 19),
              ]);
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          clearInterval(pingInterval);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const clearNotifications = () => {
    setLiveNotifications([]);
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, liveNotifications, clearNotifications }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
