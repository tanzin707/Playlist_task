'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import TrackLibrary from './components/TrackLibrary';
import PlaylistPanel from './components/PlaylistPanel';
import NowPlayingBar from './components/NowPlayingBar';
import ConnectionIndicator from './components/ConnectionIndicator';
import PlaylistSelector from './components/PlaylistSelector';
import UserPresence from './components/UserPresence';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './lib/api';

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortByVotes, setSortByVotes] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const { connected, reconnecting, ws, currentUser, activeUsers, setUserName, processedMessages, messageQueue } = useWebSocket();
  
  // Track optimistic updates for conflict resolution
  const optimisticUpdatesRef = useRef(new Map()); // id -> { type, timestamp, data }
  const pendingPositionUpdatesRef = useRef(new Map()); // id -> { position, timestamp }
  
  // Track history
  useEffect(() => {
    const history = playlist
      .filter(item => item.played_at)
      .sort((a, b) => new Date(b.played_at) - new Date(a.played_at))
      .slice(0, 10);
    setRecentlyPlayed(history);
  }, [playlist]);
  
  // Fetch initial data
  useEffect(() => {
    fetchTracks();
    fetchPlaylists();
  }, []);

  // Fetch playlists and set default
  useEffect(() => {
    if (playlists.length > 0 && !currentPlaylistId) {
      setCurrentPlaylistId(playlists[0].id);
    }
  }, [playlists, currentPlaylistId]);

  // Fetch playlist when currentPlaylistId changes
  useEffect(() => {
    if (currentPlaylistId) {
      fetchPlaylist(currentPlaylistId);
    }
  }, [currentPlaylistId]);

  const fetchTracks = async () => {
    try {
      const data = await api.getTracks();
      setTracks(data);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    }
  };

  const fetchPlaylists = useCallback(async () => {
    try {
      const data = await api.getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  }, []);

  const fetchPlaylist = useCallback(async (playlistId) => {
    try {
      const data = await api.getPlaylist(playlistId);
      setPlaylist(data);
      // Clear optimistic updates after fetching authoritative state
      optimisticUpdatesRef.current.clear();
      pendingPositionUpdatesRef.current.clear();
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    }
  }, []);

  // Message deduplication and out-of-order handling
  const processWebSocketMessage = useCallback((message) => {
    // Create message ID for deduplication
    const messageId = `${message.type}-${message.id || message.item?.id || ''}-${message.timestamp || Date.now()}`;
    
    // Skip if already processed
    if (processedMessages.has(messageId)) {
      return;
    }
    
    // Filter messages by playlist_id if provided
    if (message.playlist_id && message.playlist_id !== currentPlaylistId) {
      return; // Ignore messages for other playlists
    }
    
    // Mark as processed
    processedMessages.add(messageId);
    
    // Handle message based on type with conflict resolution
    switch (message.type) {
      case 'playlist.created':
        // Refresh playlists list
        api.getPlaylists().then(setPlaylists).catch(console.error);
        break;

      case 'playlist.deleted':
        // Refresh playlists list
        api.getPlaylists().then(setPlaylists).catch(console.error);
        break;

      case 'track.added':
        // Server is authoritative - fetch full playlist to reconcile
        if (currentPlaylistId) {
          fetchPlaylist(currentPlaylistId);
        }
        // Refresh playlists list to update track counts
        fetchPlaylists();
        break;

      case 'track.removed':
        // Server is authoritative - remove immediately
        setPlaylist((prev) => prev.filter((item) => item.id !== message.id));
        optimisticUpdatesRef.current.delete(message.id);
        // Refresh playlists list to update track counts
        fetchPlaylists();
        break;

      case 'track.moved':
        // Ignore our own updates (check if this is from our pending update)
        const pendingUpdate = pendingPositionUpdatesRef.current.get(message.item.id);
        if (pendingUpdate) {
          const positionDiff = Math.abs(pendingUpdate.position - message.item.position);
          if (positionDiff < 0.0001) {
            // This is our own update, just clear the pending state
            optimisticUpdatesRef.current.delete(message.item.id);
            pendingPositionUpdatesRef.current.delete(message.item.id);
            return;
          }
        }
        
        // Server position is authoritative for other users' moves
        setPlaylist((prev) => {
          const updated = prev.map((item) =>
            item.id === message.item.id
              ? { ...item, position: message.item.position }
              : item
          ).sort((a, b) => a.position - b.position);
          
          // Clear optimistic update for this item
          optimisticUpdatesRef.current.delete(message.item.id);
          pendingPositionUpdatesRef.current.delete(message.item.id);
          return updated;
        });
        break;

      case 'track.voted':
        // Server vote count is authoritative - update all tracks with matching track_id
        setPlaylist((prev) =>
          prev.map((item) =>
            item.track_id === message.track_id || item.track?.id === message.track_id
              ? { ...item, track: { ...item.track, votes: message.item.votes } } // Update track votes
              : item
          )
        );
        // Also update the tracks list if we have it
        setTracks((prev) =>
          prev.map((track) =>
            track.id === message.track_id
              ? { ...track, votes: message.item.votes }
              : track
          )
        );
        optimisticUpdatesRef.current.delete(message.item.id);
        break;

      case 'track.playing':
        // Server playing state is authoritative
        setPlaylist((prev) =>
          prev.map((item) => ({ ...item, is_playing: item.id === message.id }))
        );
        break;

      default:
        // Unknown message type
        break;
    }
  }, [processedMessages, currentPlaylistId, fetchPlaylist, fetchPlaylists]);

  // Handle WebSocket messages with deduplication and ordering
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Ignore ping messages
        if (message.type === 'ping') return;

        // Add timestamp if not present for ordering
        if (!message.timestamp) {
          message.timestamp = Date.now();
        }

        // Process message (handles deduplication internally)
        processWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, processWebSocketMessage]);

  // Position calculation algorithm (moved before handleDragEnd)
  const calculatePosition = useCallback((prevPosition, nextPosition) => {
    if (!prevPosition && !nextPosition) return 1.0;
    if (!prevPosition) return nextPosition - 1;
    if (!nextPosition) return prevPosition + 1;
    return (prevPosition + nextPosition) / 2;
  }, []);

  // Simple position update function
  const updatePosition = useCallback(async (id, position) => {
    try {
      await api.updatePlaylistTrack(id, { position });
      // Clear pending update after a delay to allow WebSocket message to arrive
      setTimeout(() => {
        pendingPositionUpdatesRef.current.delete(id);
      }, 1000);
    } catch (error) {
      console.error('Failed to update position:', error);
      pendingPositionUpdatesRef.current.delete(id);
      optimisticUpdatesRef.current.delete(id);
      // Revert on failure
      if (currentPlaylistId) {
        fetchPlaylist(currentPlaylistId);
      }
      throw error;
    }
  }, [currentPlaylistId, fetchPlaylist]);

  // Simple drag end handler - following assignment example pattern exactly
  const handleDragEnd = useCallback((result) => {
    // Handle cancelled drag
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;
    
    // Handle no-op drag
    if (source.index === destination.index) {
      return;
    }

    // Get current playlist state
    const currentPlaylist = [...playlist];
    const draggedId = currentPlaylist[source.index]?.id;
    
    if (!draggedId) {
      console.error('Dragged item not found');
      return;
    }

    // Following assignment pattern: get prev and next tracks at targetIndex
    // Note: We need to account for the fact that we're removing from source.index
    // If dragging to a position after source, indices shift down by 1
    const targetIndex = destination.index;
    let adjustedPlaylist = [...currentPlaylist];
    
    // Remove dragged item temporarily to get correct prev/next references
    adjustedPlaylist.splice(source.index, 1);
    
    // Get prev and next tracks at destination (following assignment pattern)
    const prevTrack = targetIndex > 0 ? adjustedPlaylist[targetIndex - 1] : null;
    const nextTrack = targetIndex < adjustedPlaylist.length ? adjustedPlaylist[targetIndex] : null;
    
    // Calculate new position using the required algorithm
    const newPosition = calculatePosition(
      prevTrack?.position || null,
      nextTrack?.position || null
    );

    // Track this update to ignore our own WebSocket messages
    pendingPositionUpdatesRef.current.set(draggedId, {
      position: newPosition,
      timestamp: Date.now()
    });

    // Optimistic update - update local playlist immediately (following assignment pattern)
    const updatedPlaylist = currentPlaylist.map((item) =>
      item.id === draggedId
        ? { ...item, position: newPosition }
        : item
    ).sort((a, b) => a.position - b.position);
    
    setPlaylist(updatedPlaylist);

    // Server update with revert on failure (following assignment pattern)
    updatePosition(draggedId, newPosition).catch(() => {
      // Revert on failure - fetch fresh playlist from server
      if (currentPlaylistId) {
        fetchPlaylist(currentPlaylistId);
      }
    });
  }, [playlist, calculatePosition, updatePosition, currentPlaylistId, fetchPlaylist]);

  // Handle playlist selection
  const handleSelectPlaylist = useCallback((playlistId) => {
    setCurrentPlaylistId(playlistId);
    setSortByVotes(false); // Reset sort when switching playlists
  }, []);

  // Handle playlist creation
  const handleCreatePlaylist = useCallback(async (name, description) => {
    const playlist = await api.createPlaylist(name, description);
    await fetchPlaylists();
    return playlist;
  }, []);

  // Handle playlist deletion
  const handleDeletePlaylist = useCallback(async (playlistId) => {
    await api.deletePlaylist(playlistId);
    await fetchPlaylists();
  }, []);

  // Optimistic add track
  const handleAddTrack = useCallback(async (trackId, addedBy = null) => {
    if (!currentPlaylistId) {
      alert('Please select a playlist first');
      return;
    }

    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    // Check if already in playlist
    const existingItem = playlist.find(item => item.track_id === trackId);
    if (existingItem) {
      alert('Track is already in the playlist');
      return;
    }

    // Use current user's name if available, otherwise use provided or default
    const userName = addedBy || currentUser?.name || 'Anonymous';

    // Calculate position for new track (add to end)
    const lastPosition = playlist.length > 0 
      ? Math.max(...playlist.map(item => item.position))
      : 0;
    const newPosition = lastPosition + 1;

    // Create optimistic playlist item (votes come from track, not playlist item)
    const optimisticItem = {
      id: `temp-${Date.now()}`,
      track_id: trackId,
      track: track, // Track already has votes property
      position: newPosition,
      added_by: userName,
      added_at: new Date().toISOString(),
      is_playing: false,
      played_at: null,
      playlist_id: currentPlaylistId,
    };

    // Optimistic update
    setPlaylist((prev) => [...prev, optimisticItem].sort((a, b) => a.position - b.position));
    
    // Track optimistic update
    optimisticUpdatesRef.current.set(optimisticItem.id, {
      type: 'add',
      timestamp: Date.now(),
      data: { trackId, addedBy: userName }
    });

    // Update server
    try {
      const result = await api.addTrackToPlaylist(trackId, userName, currentPlaylistId);
      // Server will send track.added event, which will reconcile
      // Refresh playlists list to update track counts
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to add track:', error);
      // Revert optimistic update
      setPlaylist((prev) => prev.filter(item => item.id !== optimisticItem.id));
      optimisticUpdatesRef.current.delete(optimisticItem.id);
      alert(error.response?.data?.error?.message || 'Failed to add track');
    }
  }, [tracks, playlist, currentPlaylistId, currentUser]);

  // Optimistic remove track
  const handleRemoveTrack = useCallback(async (id) => {
    const itemToRemove = playlist.find(item => item.id === id);
    if (!itemToRemove) return;

    // Optimistic update
    setPlaylist((prev) => prev.filter((item) => item.id !== id));
    
    // Track optimistic update
    optimisticUpdatesRef.current.set(id, {
      type: 'remove',
      timestamp: Date.now(),
      data: { id }
    });

    // Update server
    try {
      await api.removeTrackFromPlaylist(id);
      // Server will send track.removed event, which will reconcile
      // Refresh playlists list to update track counts
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to remove track:', error);
      // Revert optimistic update
      if (itemToRemove) {
        setPlaylist((prev) => [...prev, itemToRemove].sort((a, b) => a.position - b.position));
      }
      optimisticUpdatesRef.current.delete(id);
    }
  }, [playlist]);

  // Optimistic vote
  const handleVote = useCallback(async (playlistTrackId, direction) => {
    // Find the playlist item
    const playlistItem = playlist.find(item => item.id === playlistTrackId);
    if (!playlistItem) return;

    // Get current votes from track (votes are now on Track model)
    const currentVotes = playlistItem.track?.votes || 0;

    // Optimistic update - update track votes
    const optimisticVotes = currentVotes + (direction === 'up' ? 1 : -1);
    setPlaylist((prev) =>
      prev.map((item) =>
        item.id === playlistTrackId
          ? { ...item, track: { ...item.track, votes: optimisticVotes } }
          : item
      )
    );
    // Also update tracks list
    setTracks((prev) =>
      prev.map((track) =>
        track.id === playlistItem.track_id
          ? { ...track, votes: optimisticVotes }
          : track
      )
    );

    // Track optimistic update
    optimisticUpdatesRef.current.set(playlistTrackId, {
      type: 'vote',
      timestamp: Date.now(),
      data: { direction, previousVotes: currentVotes, track_id: playlistItem.track_id },
    });

    try {
      await api.voteOnPlaylistTrack(playlistTrackId, direction);
    } catch (error) {
      console.error('Failed to vote:', error);
      // Revert optimistic update
      setPlaylist((prev) =>
        prev.map((item) =>
          item.id === playlistTrackId
            ? { ...item, track: { ...item.track, votes: currentVotes } }
            : item
        )
      );
      setTracks((prev) =>
        prev.map((track) =>
          track.id === playlistItem.track_id
            ? { ...track, votes: currentVotes }
            : track
        )
      );
      optimisticUpdatesRef.current.delete(playlistTrackId);
    }
  }, [playlist, tracks]);

  // Optimistic play track
  const handlePlay = useCallback(async (id) => {
    // Optimistic update
    setPlaylist((prev) =>
      prev.map((item) => ({ 
        ...item, 
        is_playing: item.id === id,
        played_at: item.id === id ? new Date().toISOString() : item.played_at
      }))
    );
    
    // Track optimistic update
    optimisticUpdatesRef.current.set(id, {
      type: 'play',
      timestamp: Date.now(),
      data: { id }
    });

    // Update server
    try {
      await api.updatePlaylistTrack(id, { is_playing: true, played_at: new Date().toISOString() });
      // Server will send track.playing event, which will reconcile
    } catch (error) {
      console.error('Failed to set playing:', error);
      // Revert optimistic update
      setPlaylist((prev) =>
        prev.map((item) => ({ ...item, is_playing: false }))
      );
      optimisticUpdatesRef.current.delete(id);
    }
  }, []);

  // Optimistic skip track
  const handleSkip = useCallback(async () => {
    const nowPlaying = playlist.find((item) => item.is_playing);
    if (!nowPlaying) return;

    const currentIndex = playlist.findIndex((item) => item.id === nowPlaying.id);
    const nextTrack = playlist[currentIndex + 1];
    if (!nextTrack) return;

    // Optimistic update
    setPlaylist((prev) =>
      prev.map((item) => ({ ...item, is_playing: item.id === nextTrack.id }))
    );

    // Update server
    try {
      await api.updatePlaylistTrack(nextTrack.id, { is_playing: true });
      // Server will send track.playing event, which will reconcile
    } catch (error) {
      console.error('Failed to skip:', error);
      // Revert optimistic update
      setPlaylist((prev) =>
        prev.map((item) => ({ ...item, is_playing: item.id === nowPlaying.id }))
      );
    }
  }, [playlist]);

  // Memoized filtered tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesSearch =
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [tracks, searchQuery, selectedGenre]);

  // Memoized genres
  const genres = useMemo(() => {
    return ['all', ...new Set(tracks.map((t) => t.genre))];
  }, [tracks]);

  // Memoized now playing track
  const nowPlaying = useMemo(() => {
    return playlist.find((item) => item.is_playing);
  }, [playlist]);

  // Sort playlist by votes if enabled (using track votes)
  const sortedPlaylist = useMemo(() => {
    if (!sortByVotes) return playlist;
    return [...playlist].sort((a, b) => (b.track?.votes || 0) - (a.track?.votes || 0));
  }, [playlist, sortByVotes]);

  // Handle auto-sort by votes
  const handleSortByVotes = useCallback(async () => {
    if (!sortByVotes) {
      setSortByVotes(true);
      // Sort by votes and update positions
      const sorted = [...playlist].sort((a, b) => b.votes - a.votes);
      // Update positions on server
      for (let i = 0; i < sorted.length; i++) {
        const newPosition = i + 1;
        if (sorted[i].position !== newPosition) {
          try {
            await api.updatePlaylistTrack(sorted[i].id, { position: newPosition });
          } catch (error) {
            console.error('Failed to update position:', error);
          }
        }
      }
    } else {
      setSortByVotes(false);
      if (currentPlaylistId) {
        fetchPlaylist(currentPlaylistId); // Refresh to get original order
      }
    }
  }, [playlist, sortByVotes, currentPlaylistId]);

  // Export playlist
  const exportPlaylist = useCallback(() => {
    const playlistData = playlist.map((item, index) => ({
      position: index + 1,
      title: item.track.title,
      artist: item.track.artist,
      album: item.track.album,
      duration: item.track.duration_seconds,
      votes: item.votes,
      added_by: item.added_by,
    }));
    
    const json = JSON.stringify(playlistData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [playlist]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Space: play/pause
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (nowPlaying) {
          handlePlay(nowPlaying.id);
        }
      }
      
      // Arrow keys: navigate playlist
      if (e.code === 'ArrowDown' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const currentIndex = playlist.findIndex((item) => item.id === nowPlaying?.id);
        const nextTrack = playlist[currentIndex + 1];
        if (nextTrack) {
          handlePlay(nextTrack.id);
        }
      }
      
      if (e.code === 'ArrowUp' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const currentIndex = playlist.findIndex((item) => item.id === nowPlaying?.id);
        const prevTrack = playlist[currentIndex - 1];
        if (prevTrack) {
          handlePlay(prevTrack.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nowPlaying, playlist, handlePlay]);

  return (
    <div className="min-h-screen flex bg-[#0f0f0f] text-white">
      {/* Fixed Left Sidebar - YouTube Music Style */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#030303] border-r border-[#272727] fixed left-0 top-0 bottom-0 overflow-y-auto custom-scrollbar">
        {/* Logo */}
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span className="text-xl font-semibold">Music</span>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-2">
          <a href="#" className="flex items-center gap-4 px-4 py-2.5 rounded-lg hover:bg-[#272727] transition-colors text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </a>
        </nav>

        {/* New Playlist Button */}
        <div className="px-4 py-2">
          <button
            onClick={() => {
              const name = prompt('Playlist name:');
              if (name) handleCreatePlaylist(name);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[#272727] transition-colors text-white border border-[#272727] hover:border-[#3d3d3d]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New playlist</span>
          </button>
        </div>

        {/* Playlists Section */}
        <div className="px-2 py-2 flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">Your Playlists</h3>
          </div>
          <div className="space-y-1">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className={`group flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  currentPlaylistId === playlist.id
                    ? 'bg-[#272727] text-white'
                    : 'hover:bg-[#272727] text-[#f1f1f1]'
                }`}
                onClick={() => handleSelectPlaylist(playlist.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{playlist.name}</div>
                  {playlist.description && (
                    <div className="text-xs text-[#aaaaaa] truncate mt-0.5">{playlist.description}</div>
                  )}
                </div>
                {playlists.length > 1 && playlist.name !== 'Main Playlist' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this playlist?')) handleDeletePlaylist(playlist.id);
                    }}
                    className="ml-2 p-1 text-[#aaaaaa] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header - YouTube Music Style */}
        <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#272727] px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <button className="lg:hidden p-2 hover:bg-[#272727] rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#aaaaaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search songs, albums, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-[#272727] text-white border border-[#3d3d3d] rounded-full focus:outline-none focus:border-[#3d3d3d] focus:bg-[#3d3d3d] transition-colors placeholder:text-[#717171]"
                />
              </div>
            </div>

            {/* Right Side - Connection & User */}
            <div className="flex items-center gap-3">
              <UserPresence
                users={activeUsers}
                currentUserId={currentUser?.id}
                onSetName={setUserName}
              />
              <ConnectionIndicator connected={connected} reconnecting={reconnecting} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f] pb-20">
          <div className="px-4 sm:px-6 py-6">
            {/* Genre Filters */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedGenre === genre
                      ? 'bg-white text-black'
                      : 'bg-[#272727] text-[#f1f1f1] hover:bg-[#3d3d3d]'
                  }`}
                >
                  {genre === 'all' ? 'All' : genre}
                </button>
              ))}
            </div>

            {/* Track Library Section */}
            <TrackLibrary
              tracks={filteredTracks}
              playlist={playlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedGenre={selectedGenre}
              onGenreChange={setSelectedGenre}
              genres={genres}
              onAddTrack={handleAddTrack}
              onRemoveTrack={async (trackId) => {
                const playlistItem = playlist.find(item => item.track_id === trackId);
                if (playlistItem) {
                  await handleRemoveTrack(playlistItem.id);
                }
              }}
            />

            {/* Playlist Section */}
            {currentPlaylistId ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <PlaylistPanel
                  playlist={sortByVotes ? sortedPlaylist : playlist}
                  onRemove={handleRemoveTrack}
                  onVote={handleVote}
                  onPlay={handlePlay}
                  onSortByVotes={handleSortByVotes}
                  sortByVotes={sortByVotes}
                  onExport={exportPlaylist}
                  activeUsers={activeUsers}
                />
              </DragDropContext>
            ) : (
              <div className="text-center py-16">
                <p className="text-[#aaaaaa] text-lg">Select a playlist to get started</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {nowPlaying && (
        <NowPlayingBar
          track={nowPlaying}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}
