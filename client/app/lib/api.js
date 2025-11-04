import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getTracks: async () => {
    const response = await apiClient.get('/tracks');
    return response.data;
  },

  getPlaylists: async () => {
    const response = await apiClient.get('/playlists');
    return response.data;
  },

  getPlaylist: async (playlistId) => {
    const response = await apiClient.get('/playlist', {
      params: playlistId ? { playlist_id: playlistId } : {},
    });
    return response.data;
  },

  getPlaylistById: async (playlistId) => {
    const response = await apiClient.get(`/playlists/${playlistId}`);
    return response.data;
  },

  createPlaylist: async (name, description) => {
    const response = await apiClient.post('/playlists', {
      name,
      description,
    });
    return response.data;
  },

  deletePlaylist: async (playlistId) => {
    await apiClient.delete(`/playlists/${playlistId}`);
  },

  addTrackToPlaylist: async (trackId, addedBy = 'Anonymous', playlistId) => {
    const response = await apiClient.post('/playlist', {
      track_id: trackId,
      added_by: addedBy,
      playlist_id: playlistId,
    });
    return response.data;
  },

  updatePlaylistTrack: async (id, data) => {
    const response = await apiClient.patch(`/playlist/${id}`, data);
    return response.data;
  },

  voteOnPlaylistTrack: async (playlistTrackId, direction) => {
    const response = await apiClient.post(`/playlist/${playlistTrackId}/vote`, {
      direction,
    });
    return response.data;
  },

  removeTrackFromPlaylist: async (id) => {
    await apiClient.delete(`/playlist/${id}`);
  },
};
