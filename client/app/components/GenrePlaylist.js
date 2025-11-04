export default function GenrePlaylist({ playlist, onVote }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = playlist.playlistTracks?.reduce(
    (sum, item) => sum + item.track.duration_seconds,
    0
  ) || 0;

  const genreColors = {
    Rock: 'from-red-500 to-orange-500',
    Pop: 'from-pink-500 to-rose-500',
    'R&B': 'from-purple-500 to-indigo-500',
    'Hip-Hop': 'from-yellow-500 to-amber-500',
    Alternative: 'from-green-500 to-emerald-500',
  };

  const genreGradient = genreColors[playlist.genre] || 'from-blue-500 to-cyan-500';

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${genreGradient} flex items-center justify-center`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{playlist.name}</h2>
          <p className="text-sm text-gray-400 mt-1">Read-only • Vote on tracks</p>
        </div>
        <div className="px-3 py-1 bg-gray-800/50 rounded-lg border border-gray-700">
          <span className="text-sm text-gray-300">{playlist.playlistTracks?.length || 0} tracks</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {!playlist.playlistTracks || playlist.playlistTracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No tracks in this playlist</p>
          </div>
        ) : (
          playlist.playlistTracks.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-all duration-200"
            >
              {/* Track Number */}
              <div className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm bg-gray-700 text-gray-400">
                {index + 1}
              </div>

              {/* Album Art */}
              {item.track.cover_url ? (
                <img
                  src={item.track.cover_url}
                  alt={`${item.track.title} cover`}
                  className="w-12 h-12 rounded-lg object-cover shadow-lg flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${genreGradient} flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg`}>
                  {item.track.title.charAt(0)}
                </div>
              )}

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  {item.track.title}
                </div>
                <div className="text-sm text-gray-400 truncate">{item.track.artist}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{formatDuration(item.track.duration_seconds)}</span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-500">{item.track.album}</span>
                </div>
              </div>

              {/* Votes */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(item.track.id, 'down');
                  }}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors hover:bg-red-500/20 rounded"
                  title="Downvote"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <span
                  className={`font-bold min-w-[3ch] text-center text-lg ${
                    item.track.votes > 0
                      ? 'text-green-400'
                      : item.track.votes < 0
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {item.track.votes > 0 ? '+' : ''}
                  {item.track.votes}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(item.track.id, 'up');
                  }}
                  className="p-1 text-gray-400 hover:text-green-400 transition-colors hover:bg-green-500/20 rounded"
                  title="Upvote"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Duration */}
      {playlist.playlistTracks && playlist.playlistTracks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-sm text-gray-400">
              {playlist.playlistTracks.length} track{playlist.playlistTracks.length !== 1 ? 's' : ''}
            </span>
            <span className="font-bold text-white text-lg">
              Total: {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

