'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function PlaylistSelector({ 
  playlists, 
  currentPlaylistId, 
  onSelectPlaylist, 
  onCreatePlaylist, 
  onDeletePlaylist 
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const playlist = await onCreatePlaylist(newPlaylistName.trim(), newPlaylistDescription.trim() || null);
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      onSelectPlaylist(playlist.id);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (playlistId) => {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return;
    }

    try {
      await onDeletePlaylist(playlistId);
      // If deleted playlist was current, select first available
      if (playlistId === currentPlaylistId && playlists.length > 1) {
        const remainingPlaylists = playlists.filter(p => p.id !== playlistId);
        if (remainingPlaylists.length > 0) {
          onSelectPlaylist(remainingPlaylists[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist');
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl p-3 sm:p-4 border border-gray-700/50 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white">Playlists</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {playlists.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No playlists yet</p>
          ) : (
            playlists.map((playlist) => (
              <div
                key={playlist.id}
                className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                  currentPlaylistId === playlist.id
                    ? 'bg-purple-500/20 border-2 border-purple-500/50'
                    : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600'
                }`}
                onClick={() => onSelectPlaylist(playlist.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${
                    currentPlaylistId === playlist.id ? 'text-purple-300' : 'text-white'
                  }`}>
                    {playlist.name}
                  </div>
                  {playlist.description && (
                    <div className="text-xs text-gray-400 truncate mt-0.5">{playlist.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {playlist._count?.tracks || 0} tracks
                  </div>
                </div>
                {playlists.length > 1 && playlist.name !== 'Main Playlist' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(playlist.id);
                    }}
                    className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-300 opacity-0 group-hover:opacity-100"
                    title="Delete playlist"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">Create New Playlist</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="My Playlist"
                  autoFocus
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPlaylistName.trim()}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

