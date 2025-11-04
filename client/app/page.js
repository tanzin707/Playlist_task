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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800/50 shadow-xl animate-slide-in-down sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg animate-scale-in hover:scale-110 transition-transform duration-300 hover:rotate-6">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-slide-in-right">
                  Collaborative Playlist
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 animate-fade-in">Real-time music collaboration</p>
              </div>
            </div>
            <ConnectionIndicator connected={connected} reconnecting={reconnecting} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 pb-24 sm:pb-32 relative z-10">
        {/* Playlist Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-2 lg:order-1">
            <PlaylistSelector
              playlists={playlists}
              currentPlaylistId={currentPlaylistId}
              onSelectPlaylist={handleSelectPlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
            />
            <UserPresence
              users={activeUsers}
              currentUserId={currentUser?.id}
              onSetName={setUserName}
            />
          </div>
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8 order-1 lg:order-2">
            {/* Track Library */}
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

            {/* Main Collaborative Playlist */}
            {currentPlaylistId ? (
              <>
                {!sortByVotes ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <PlaylistPanel
                      playlist={playlist}
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
                  <PlaylistPanel
                    playlist={sortedPlaylist}
                    onRemove={handleRemoveTrack}
                    onVote={handleVote}
                    onPlay={handlePlay}
                    onSortByVotes={handleSortByVotes}
                    sortByVotes={sortByVotes}
                    onExport={exportPlaylist}
                    activeUsers={activeUsers}
                  />
                )}
                
                {/* Recently Played */}
                {recentlyPlayed.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 animate-fade-in relative overflow-hidden">
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2 sm:gap-3">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recently Played
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {recentlyPlayed.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/60 rounded-lg border border-gray-700/50 hover:bg-gray-800/80 hover:border-purple-500/30 transition-all duration-300 hover:scale-105"
                          >
                            {item.track.cover_url ? (
                              <img
                                src={item.track.cover_url}
                                alt={`${item.track.title} cover`}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0 shadow-md"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                                {item.track.title.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate text-xs sm:text-sm">{item.track.title}</div>
                              <div className="text-xs text-gray-400 truncate">{item.track.artist}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-12 border border-gray-700 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-gray-400 text-lg">Select a playlist to get started</p>
                <p className="text-gray-500 text-sm mt-2">Or create a new one using the panel on the left</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {nowPlaying && (
        <NowPlayingBar
          track={nowPlaying}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}
