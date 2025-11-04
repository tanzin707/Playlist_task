const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection management
const clients = new Map(); // Map<WebSocket, { id, name, avatar, joinedAt }>

// Generate a random color for avatar
function generateAvatarColor(str) {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-500',
  ];
  const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return colors[Math.abs(hash) % colors.length];
}

// Generate user name from ID
function generateUserName(id) {
  const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake'];
  const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return names[Math.abs(hash) % names.length];
}

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function broadcastPresenceUpdate() {
  const activeUsers = Array.from(clients.values()).map(({ id, name, avatar, joinedAt }) => ({
    id,
    name,
    avatar,
    joinedAt,
  }));
  
  broadcast({
    type: 'users.presence',
    users: activeUsers,
  });
}

// Heartbeat ping
setInterval(() => {
  broadcast({
    type: 'ping',
    ts: new Date().toISOString(),
  });
}, 30000);

// WebSocket connection handler
wss.on('connection', (ws) => {
  // Generate unique user ID
  const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const userName = generateUserName(userId);
  const avatarColor = generateAvatarColor(userId);
  
  const userInfo = {
    id: userId,
    name: userName,
    avatar: avatarColor,
    joinedAt: new Date().toISOString(),
  };
  
  clients.set(ws, userInfo);
  console.log(`User connected: ${userName} (${userId}). Total users: ${clients.size}`);

  // Send current user info to the newly connected client
  ws.send(JSON.stringify({
    type: 'user.joined',
    user: userInfo,
  }));

  // Broadcast presence update to all clients
  broadcastPresenceUpdate();

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`User disconnected: ${userName}. Total users: ${clients.size}`);
    // Broadcast presence update
    broadcastPresenceUpdate();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle user setting their name
      if (data.type === 'user.setName' && data.name) {
        const userInfo = clients.get(ws);
        if (userInfo) {
          userInfo.name = data.name.trim().substring(0, 20) || userInfo.name;
          clients.set(ws, userInfo);
          broadcastPresenceUpdate();
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
});

// Position calculation algorithm
function calculatePosition(prevPosition, nextPosition) {
  if (!prevPosition && !nextPosition) return 1.0;
  if (!prevPosition) return nextPosition - 1;
  if (!nextPosition) return prevPosition + 1;
  return (prevPosition + nextPosition) / 2;
}

// Helper function to get default playlist
async function getDefaultPlaylist() {
  const playlist = await prisma.playlist.findFirst({
    orderBy: { created_at: 'asc' },
  });
  return playlist;
}

// API Routes

// GET /api/playlists - Get all playlists
app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch playlists',
      },
    });
  }
});

// GET /api/playlists/:id - Get a specific playlist
app.get('/api/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            track: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration_seconds: true,
                album: true,
                genre: true,
                cover_url: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tracks: true },
        },
      },
    });

    if (!playlist) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        },
      });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch playlist',
      },
    });
  }
});

// POST /api/playlists - Create a new playlist
app.post('/api/playlists', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_NAME',
          message: 'name is required',
        },
      });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description || null,
      },
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    // Broadcast playlist creation
    broadcast({
      type: 'playlist.created',
      playlist,
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create playlist',
      },
    });
  }
});

// DELETE /api/playlists/:id - Delete a playlist
app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        },
      });
    }

    await prisma.playlist.delete({
      where: { id },
    });

    // Broadcast playlist deletion
    broadcast({
      type: 'playlist.deleted',
      id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete playlist',
      },
    });
  }
});

// GET /api/tracks - Get all available tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { title: 'asc' },
    });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tracks',
      },
    });
  }
});

// GET /api/playlist - Get current playlist ordered by position (uses playlist_id query param or default)
app.get('/api/playlist', async (req, res) => {
  try {
    const { playlist_id } = req.query;
    let playlistId = playlist_id;

    // If no playlist_id provided, use default playlist
    if (!playlistId) {
      const defaultPlaylist = await getDefaultPlaylist();
      if (!defaultPlaylist) {
        return res.status(404).json({
          error: {
            code: 'NO_PLAYLIST',
            message: 'No playlist found',
          },
        });
      }
      playlistId = defaultPlaylist.id;
    }

    const playlistTracks = await prisma.playlistTrack.findMany({
      where: { playlist_id: playlistId },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            duration_seconds: true,
            album: true,
            genre: true,
            cover_url: true,
            votes: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });
    res.json(playlistTracks);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch playlist',
      },
    });
  }
});

// POST /api/playlist - Add track to playlist
app.post('/api/playlist', async (req, res) => {
  try {
    const { track_id, playlist_id, added_by = 'Anonymous' } = req.body;

    if (!track_id) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TRACK_ID',
          message: 'track_id is required',
        },
      });
    }

    // Determine playlist_id
    let playlistId = playlist_id;
    if (!playlistId) {
      const defaultPlaylist = await getDefaultPlaylist();
      if (!defaultPlaylist) {
        return res.status(404).json({
          error: {
            code: 'NO_PLAYLIST',
            message: 'No playlist found',
          },
        });
      }
      playlistId = defaultPlaylist.id;
    }

    // Check if track already exists in this playlist
    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlist_id_track_id: {
          playlist_id: playlistId,
          track_id: track_id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_TRACK',
          message: 'This track is already in the playlist',
          details: { track_id },
        },
      });
    }

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: track_id },
    });

    if (!track) {
      return res.status(404).json({
        error: {
          code: 'TRACK_NOT_FOUND',
          message: 'Track not found',
        },
      });
    }

    // Get current playlist tracks to calculate position
    const playlistTracks = await prisma.playlistTrack.findMany({
      where: { playlist_id: playlistId },
      orderBy: { position: 'asc' },
    });

    // Calculate position (add to end)
    let position;
    if (playlistTracks.length === 0) {
      position = 1.0;
    } else {
      const lastTrack = playlistTracks[playlistTracks.length - 1];
      position = lastTrack.position + 1;
    }

    // Create playlist track (votes are on Track, not PlaylistTrack)
    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlist_id: playlistId,
        track_id,
        position,
        added_by,
        is_playing: false,
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            duration_seconds: true,
            album: true,
            genre: true,
            cover_url: true,
            votes: true,
          },
        },
      },
    });

    // Broadcast to all clients
    broadcast({
      type: 'track.added',
      playlist_id: playlistId,
      item: playlistTrack,
    });

    res.status(201).json(playlistTrack);
  } catch (error) {
    console.error('Error adding track:', error);
    res.status(500).json({
      error: {
        code: 'ADD_ERROR',
        message: 'Failed to add track to playlist',
      },
    });
  }
});

// PATCH /api/playlist/:id - Update position or playing status
app.patch('/api/playlist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, is_playing } = req.body;

    const playlistTrack = await prisma.playlistTrack.findUnique({
      where: { id },
    });

    if (!playlistTrack) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist track not found',
        },
      });
    }

    const updateData = {};
    if (position !== undefined) updateData.position = position;
    if (is_playing !== undefined) {
      updateData.is_playing = is_playing;
      if (is_playing) {
        updateData.played_at = new Date();
        // Unset all other playing tracks in the same playlist
        await prisma.playlistTrack.updateMany({
          where: { 
            is_playing: true, 
            id: { not: id },
            playlist_id: playlistTrack.playlist_id,
          },
          data: { is_playing: false },
        });
      }
    }

    const updated = await prisma.playlistTrack.update({
      where: { id },
      data: updateData,
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            duration_seconds: true,
            album: true,
            genre: true,
            cover_url: true,
            votes: true,
          },
        },
      },
    });

    // Broadcast appropriate event
    if (position !== undefined) {
      broadcast({
        type: 'track.moved',
        playlist_id: updated.playlist_id,
        item: { id: updated.id, position: updated.position },
      });
    }
    if (is_playing !== undefined && is_playing) {
      broadcast({
        type: 'track.playing',
        playlist_id: updated.playlist_id,
        id: updated.id,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating playlist track:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist track not found',
        },
      });
    }
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update playlist track',
      },
    });
  }
});

// POST /api/playlist/:id/vote - Vote on a track
app.post('/api/playlist/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DIRECTION',
          message: 'direction must be "up" or "down"',
        },
      });
    }

    const increment = direction === 'up' ? 1 : -1;

    // Get the playlist track to find the track_id
    const playlistTrack = await prisma.playlistTrack.findUnique({
      where: { id },
      include: {
        track: true,
      },
    });

    if (!playlistTrack) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist track not found',
        },
      });
    }

    // Update track votes (votes are now on Track model, not PlaylistTrack)
    const updatedTrack = await prisma.track.update({
      where: { id: playlistTrack.track_id },
      data: {
        votes: {
          increment,
        },
      },
      select: {
        id: true,
        title: true,
        artist: true,
        duration_seconds: true,
        album: true,
        genre: true,
        cover_url: true,
        votes: true,
      },
    });

    // Get updated playlist track with track data
    const updatedPlaylistTrack = await prisma.playlistTrack.findUnique({
      where: { id },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            duration_seconds: true,
            album: true,
            genre: true,
            cover_url: true,
            votes: true,
          },
        },
      },
    });

    // Broadcast vote update (include track_id so all playlists can update)
    broadcast({
      type: 'track.voted',
      track_id: updatedTrack.id,
      playlist_id: playlistTrack.playlist_id,
      item: {
        id: playlistTrack.id,
        track_id: updatedTrack.id,
        votes: updatedTrack.votes,
      },
    });

    res.json(updatedPlaylistTrack);
  } catch (error) {
    console.error('Error voting:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist track not found',
        },
      });
    }
    res.status(500).json({
      error: {
        code: 'VOTE_ERROR',
        message: 'Failed to vote on track',
      },
    });
  }
});

// DELETE /api/playlist/:id - Remove track from playlist
app.delete('/api/playlist/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const playlistTrack = await prisma.playlistTrack.findUnique({
      where: { id },
    });

    if (!playlistTrack) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist track not found',
        },
      });
    }

    const playlistId = playlistTrack.playlist_id;

    await prisma.playlistTrack.delete({
      where: { id },
    });

    // Broadcast removal
    broadcast({
      type: 'track.removed',
      playlist_id: playlistId,
      id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing track:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Playlist track not found',
        },
      });
    }
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to remove track from playlist',
      },
    });
  }
});

// Export calculatePosition for use in drag-and-drop operations
app.calculatePosition = calculatePosition;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
});
