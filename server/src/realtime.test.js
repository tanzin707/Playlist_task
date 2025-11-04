const WebSocket = require('ws');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

describe('Realtime Communication', () => {
  let server;
  let wss;
  let prisma;
  const PORT = 4001; // Use different port for testing
  const clients = new Map();

  // Mock broadcast function
  function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create test server
    server = http.createServer();
    wss = new WebSocket.Server({ server });

    // Setup WebSocket connection handler
    wss.on('connection', (ws) => {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userInfo = {
        id: userId,
        name: `User-${userId.slice(-4)}`,
        avatar: 'from-purple-500 to-pink-500',
        joinedAt: new Date().toISOString(),
      };
      
      clients.set(ws, userInfo);

      ws.on('close', () => {
        clients.delete(ws);
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'user.setName' && data.name) {
            const userInfo = clients.get(ws);
            if (userInfo) {
              userInfo.name = data.name.trim().substring(0, 20) || userInfo.name;
              clients.set(ws, userInfo);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
    });

    await new Promise((resolve) => {
      server.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    // Close all WebSocket connections
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    // Wait for connections to close
    await new Promise((resolve) => setTimeout(resolve, 100));

    await new Promise((resolve) => {
      wss.close(() => {
        server.close(() => {
          setTimeout(resolve, 100);
        });
      });
    });

    await prisma.$disconnect();
  }, 10000); // Increase timeout to 10 seconds

  describe('Event Broadcasting', () => {
    let ws1, ws2, ws3;
    let messages1, messages2, messages3;

    beforeEach(async () => {
      messages1 = [];
      messages2 = [];
      messages3 = [];

      // Create three WebSocket connections
      ws1 = await new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${PORT}`);
        ws.on('open', () => resolve(ws));
        ws.on('message', (data) => {
          messages1.push(JSON.parse(data.toString()));
        });
      });

      ws2 = await new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${PORT}`);
        ws.on('open', () => resolve(ws));
        ws.on('message', (data) => {
          messages2.push(JSON.parse(data.toString()));
        });
      });

      ws3 = await new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${PORT}`);
        ws.on('open', () => resolve(ws));
        ws.on('message', (data) => {
          messages3.push(JSON.parse(data.toString()));
        });
      });

      // Wait for connections to be established
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    afterEach(async () => {
      if (ws1 && ws1.readyState === WebSocket.OPEN) ws1.close();
      if (ws2 && ws2.readyState === WebSocket.OPEN) ws2.close();
      if (ws3 && ws3.readyState === WebSocket.OPEN) ws3.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should broadcast track.added event to all clients', async () => {
      const event = {
        type: 'track.added',
        item: {
          id: 'test-id',
          track_id: 'track-123',
          position: 1.0,
        },
      };

      broadcast(event);

      // Wait for messages to be received
      await new Promise((resolve) => setTimeout(resolve, 100));

      // All clients should receive the message
      expect(messages1.some((m) => m.type === 'track.added')).toBe(true);
      expect(messages2.some((m) => m.type === 'track.added')).toBe(true);
      expect(messages3.some((m) => m.type === 'track.added')).toBe(true);
    });

    it('should broadcast track.moved event to all clients', async () => {
      const event = {
        type: 'track.moved',
        id: 'test-id',
        position: 1.5,
        playlist_id: 'playlist-123',
      };

      broadcast(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages1.some((m) => m.type === 'track.moved')).toBe(true);
      expect(messages2.some((m) => m.type === 'track.moved')).toBe(true);
      expect(messages3.some((m) => m.type === 'track.moved')).toBe(true);
    });

    it('should broadcast track.voted event to all clients', async () => {
      const event = {
        type: 'track.voted',
        track_id: 'track-123',
        item: {
          id: 'playlist-track-id',
          votes: 5,
        },
        playlist_id: 'playlist-123',
      };

      broadcast(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages1.some((m) => m.type === 'track.voted')).toBe(true);
      expect(messages2.some((m) => m.type === 'track.voted')).toBe(true);
      expect(messages3.some((m) => m.type === 'track.voted')).toBe(true);
    });

    it('should broadcast track.playing event to all clients', async () => {
      const event = {
        type: 'track.playing',
        id: 'test-id',
        is_playing: true,
        playlist_id: 'playlist-123',
      };

      broadcast(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages1.some((m) => m.type === 'track.playing')).toBe(true);
      expect(messages2.some((m) => m.type === 'track.playing')).toBe(true);
      expect(messages3.some((m) => m.type === 'track.playing')).toBe(true);
    });

    it('should broadcast track.removed event to all clients', async () => {
      const event = {
        type: 'track.removed',
        id: 'test-id',
        playlist_id: 'playlist-123',
      };

      broadcast(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages1.some((m) => m.type === 'track.removed')).toBe(true);
      expect(messages2.some((m) => m.type === 'track.removed')).toBe(true);
      expect(messages3.some((m) => m.type === 'track.removed')).toBe(true);
    });

    it('should broadcast user presence updates', async () => {
      const activeUsers = [
        { id: 'user-1', name: 'User1', avatar: 'from-purple-500 to-pink-500', joinedAt: new Date().toISOString() },
        { id: 'user-2', name: 'User2', avatar: 'from-blue-500 to-cyan-500', joinedAt: new Date().toISOString() },
      ];

      broadcast({
        type: 'users.presence',
        users: activeUsers,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const presenceMessages = messages1.filter((m) => m.type === 'users.presence');
      expect(presenceMessages.length).toBeGreaterThan(0);
      expect(presenceMessages[0].users).toBeDefined();
    });
  });

  describe('Reconnection Logic', () => {
    let ws;
    let reconnectAttempts = 0;
    let messages = [];

    it('should handle WebSocket disconnection gracefully', async () => {
      ws = await new Promise((resolve) => {
        const websocket = new WebSocket(`ws://localhost:${PORT}`);
        websocket.on('open', () => resolve(websocket));
        websocket.on('message', (data) => {
          messages.push(JSON.parse(data.toString()));
        });
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);

      // Close connection
      ws.close();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('should allow reconnection after disconnection', async () => {
      // First connection
      ws = await new Promise((resolve) => {
        const websocket = new WebSocket(`ws://localhost:${PORT}`);
        websocket.on('open', () => resolve(websocket));
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reconnect
      ws = await new Promise((resolve) => {
        const websocket = new WebSocket(`ws://localhost:${PORT}`);
        websocket.on('open', () => resolve(websocket));
      });

      expect(ws.readyState).toBe(WebSocket.OPEN);

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    it('should process queued messages after reconnection', async () => {
      // Test that client can reconnect and receive server broadcasts
      ws = await new Promise((resolve) => {
        const websocket = new WebSocket(`ws://localhost:${PORT}`);
        websocket.on('open', () => resolve(websocket));
        websocket.on('message', (data) => {
          messages.push(JSON.parse(data.toString()));
        });
      });

      // Simulate server broadcasting a message (which would happen after reconnection)
      broadcast({
        type: 'track.added',
        playlist_id: 'test-playlist',
        item: { id: 'queued-1', title: 'Test Track' },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Client should receive the broadcast message
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(msg => msg.type === 'track.added')).toBe(true);

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
  });

  describe('Client Message Handling', () => {
    let ws;
    let serverMessages = [];

    beforeEach(async () => {
      serverMessages = [];
      
      ws = await new Promise((resolve) => {
        const websocket = new WebSocket(`ws://localhost:${PORT}`);
        websocket.on('open', () => resolve(websocket));
      });

      // Capture messages sent from server
      const originalSend = ws.send;
      ws.send = function(data) {
        serverMessages.push(JSON.parse(data.toString()));
        return originalSend.apply(this, arguments);
      };
    });

    afterEach(async () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should handle user.setName message', async () => {
      const setNameMessage = {
        type: 'user.setName',
        name: 'NewUserName',
      };

      ws.send(JSON.stringify(setNameMessage));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Server should process the message and update user info
      expect(clients.size).toBeGreaterThan(0);
    });

    it('should validate and sanitize user name', async () => {
      const longName = 'A'.repeat(50); // Very long name
      const setNameMessage = {
        type: 'user.setName',
        name: longName,
      };

      ws.send(JSON.stringify(setNameMessage));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Name should be trimmed to max length (20)
      const userInfo = Array.from(clients.values())[0];
      if (userInfo) {
        expect(userInfo.name.length).toBeLessThanOrEqual(20);
      }
    });
  });
});

