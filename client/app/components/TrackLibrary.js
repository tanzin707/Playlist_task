import { memo, useMemo } from 'react';
import TrackTooltip from './TrackTooltip';

function TrackLibrary({
  tracks,
  playlist,
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  onAddTrack,
  onRemoveTrack,
}) {
  // Memoize playlist lookups for performance
  const { playlistTrackIds, playlistMap } = useMemo(() => {
    const ids = new Set(playlist.map((item) => item.track_id));
    const map = new Map(playlist.map(item => [item.track_id, item]));
    return { playlistTrackIds: ids, playlistMap: map };
  }, [playlist]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 animate-fade-in relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-scale-in shadow-lg flex-shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white animate-slide-in-right">Track Library</h2>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-800/80 text-white border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 placeholder-gray-500 hover:border-gray-600 text-sm sm:text-base"
            />
          </div>
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-800/80 text-white border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 cursor-pointer hover:border-gray-600 text-sm sm:text-base"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === 'all' ? '🎵 All Genres' : genre}
              </option>
            ))}
          </select>
        </div>

        {/* Track List */}
        <div className="max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto space-y-2 custom-scrollbar">
        {tracks.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-gray-400">No tracks found</p>
          </div>
        ) : (
          tracks.map((track, index) => {
            const isInPlaylist = playlistTrackIds.has(track.id);
            const playlistItem = playlistMap.get(track.id);
            const genreColors = {
              Rock: 'from-red-500 to-orange-500',
              Pop: 'from-pink-500 to-rose-500',
              Electronic: 'from-purple-500 to-indigo-500',
              Jazz: 'from-blue-500 to-cyan-500',
              Classical: 'from-amber-500 to-yellow-500',
            };
            const genreGradient = genreColors[track.genre] || 'from-gray-500 to-gray-600';

            return (
              <div
                key={track.id}
                style={{ animationDelay: `${index * 0.05}s` }}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/30 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.01] animate-slide-in-up"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  {/* Album Art */}
                  {track.cover_url ? (
                    <TrackTooltip track={track} position="right">
                      <img
                        src={track.cover_url}
                        alt={`${track.title} cover`}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 cursor-pointer"
                        loading="lazy"
                      />
                    </TrackTooltip>
                  ) : (
                    <TrackTooltip track={track} position="right">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br ${genreGradient} flex-shrink-0 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 cursor-pointer`}>
                        {track.title.charAt(0)}
                      </div>
                    </TrackTooltip>
                  )}

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate group-hover:text-purple-300 transition-all duration-300 text-sm sm:text-base">
                      {track.title}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate transition-colors duration-300 group-hover:text-gray-300">{track.artist}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full transition-all duration-300 group-hover:bg-purple-500/20 group-hover:text-purple-300">
                        {track.genre}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:inline">•</span>
                      <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[150px]">{track.album}</span>
                    </div>
                  </div>
                </div>

                {/* Duration and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm text-gray-400 font-mono transition-all duration-300 group-hover:text-gray-300">{formatDuration(track.duration_seconds)}</span>
                  <div className="flex items-center gap-2">
                    {isInPlaylist ? (
                      <>
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs sm:text-sm font-medium border border-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 animate-bounce-in">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="hidden sm:inline">In Playlist</span>
                          <span className="sm:hidden">Added</span>
                        </div>
                        <button
                          onClick={() => onRemoveTrack(track.id)}
                          className="px-2 sm:px-4 py-1 sm:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-all duration-300 border border-red-500/30 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onAddTrack(track.id)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 relative overflow-hidden group text-xs sm:text-sm"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 relative z-10 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="relative z-10 hidden sm:inline">Add to Playlist</span>
                        <span className="relative z-10 sm:hidden">Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}

export default memo(TrackLibrary);
