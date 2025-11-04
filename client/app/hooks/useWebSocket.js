import { useEffect, useState, useRef, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [ws, setWs] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Current user info
  const [activeUsers, setActiveUsers] = useState([]); // List of active users
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const actionQueueRef = useRef([]);
  const processedMessagesRef = useRef(new Set()); // For deduplication
  const messageQueueRef = useRef([]); // For handling out-of-order messages
  const maxReconnectAttempts = 10;
  const baseDelay = 1000; // 1 second

  // Process queued actions when connected
  const processActionQueue = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    while (actionQueueRef.current.length > 0) {
      const action = actionQueueRef.current.shift();
      try {
        ws.send(JSON.stringify(action));
      } catch (error) {
        console.error('Failed to send queued action:', error);
        // Re-queue if failed
        actionQueueRef.current.unshift(action);
        break;
      }
    }
  }, [ws]);

  // Queue action for later if disconnected
  const queueAction = useCallback((action) => {
    actionQueueRef.current.push({ ...action, timestamp: Date.now() });
  }, []);

  // Send message or queue if disconnected
  const sendMessage = useCallback((message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message:', error);
        queueAction(message);
      }
    } else {
      queueAction(message);
    }
  }, [ws, queueAction]);

  useEffect(() => {
    let wsInstance = null;
    let pingInterval = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      
      try {
        setReconnecting(true);
        wsInstance = new WebSocket(WS_URL);

        wsInstance.onopen = () => {
          if (!isMounted) {
            wsInstance.close();
            return;
          }
          
          console.log('WebSocket connected');
          setConnected(true);
          setReconnecting(false);
          setWs(wsInstance);
          reconnectAttemptsRef.current = 0;
          
          // Process queued actions
          if (wsInstance.readyState === WebSocket.OPEN) {
            while (actionQueueRef.current.length > 0) {
              const action = actionQueueRef.current.shift();
              try {
                wsInstance.send(JSON.stringify(action));
              } catch (error) {
                console.error('Failed to send queued action:', error);
                actionQueueRef.current.unshift(action);
                break;
              }
            }
          }

          // Setup heartbeat using a standard browser send (no ws.ping in browser)
          pingInterval = setInterval(() => {
            if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
              try {
                wsInstance.send(JSON.stringify({ type: 'ping', ts: new Date().toISOString() }));
              } catch (_) {
                // Ignore send errors; reconnect logic will handle
              }
            }
          }, 30000);
        };

        wsInstance.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle user joined message
            if (message.type === 'user.joined' && message.user) {
              setCurrentUser(message.user);
            }
            
            // Handle presence updates
            if (message.type === 'users.presence' && message.users) {
              setActiveUsers(message.users);
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        wsInstance.onclose = (event) => {
          if (!isMounted) return;
          
          console.log('WebSocket disconnected', event.code, event.reason);
          setConnected(false);
          setWs(null);

          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }

          // Only reconnect if it wasn't a manual close (code 1000) and we're still mounted
          if (event.code !== 1000 && isMounted && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current += 1;
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                connect();
              }
            }, delay);
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            setReconnecting(false);
          }
        };

        wsInstance.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted) {
            setReconnecting(false);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        if (isMounted) {
          setConnected(false);
          setReconnecting(false);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (wsInstance) {
        wsInstance.close(1000, 'Component unmounting');
        wsInstance = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Send message to set user name
  const setUserName = useCallback((name) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'user.setName', name }));
      } catch (error) {
        console.error('Failed to send user name:', error);
      }
    }
  }, [ws]);

  return { 
    connected, 
    reconnecting, 
    ws, 
    currentUser,
    activeUsers,
    sendMessage,
    queueAction,
    setUserName,
    processedMessages: processedMessagesRef.current,
    messageQueue: messageQueueRef.current
  };
}

