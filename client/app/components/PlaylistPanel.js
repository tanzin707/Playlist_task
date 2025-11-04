import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useEffect, useRef, memo, useMemo, useCallback } from 'react';
import TrackTooltip from './TrackTooltip';

// Avatar component for displaying user initials
function UserAvatar({ name, avatar, size = 'sm' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${avatar || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 hover:scale-110 ${sizeClasses[size]}`}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
}

// Track Item Component with auto-scroll
const PlaylistTrackItem = memo(({ item, index, provided, snapshot, formatDuration, onRemove, onVote, onPlay, activeUsers }) => {
  const trackRef = useRef(null);
  
  // Find user by name
  const addedByUser = useMemo(() => {
    return activeUsers?.find(u => u.name === item.added_by);
  }, [activeUsers, item.added_by]);
  
  // Auto-scroll to now playing track (only when not dragging)
  useEffect(() => {
    if (!snapshot.isDragging && item.is_playing && trackRef.current) {
      trackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [item.is_playing, snapshot.isDragging]);
  
  // Skip rendering complex content when dragging for performance
  const isDragging = snapshot.isDragging;
  
  return (
    <div
      ref={(el) => {
        provided.innerRef(el);
        trackRef.current = el;
      }}
      {...provided.draggableProps}
      style={provided.draggableProps.style}
      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-200 ${
        isDragging 
          ? 'opacity-50 shadow-2xl z-50 bg-gray-800 border-2 border-purple-500/50'
          : item.is_playing
          ? 'bg-gradient-to-r from-purple-600/30 via-purple-500/20 to-pink-600/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
          : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5'
      }`}
    >
      {/* Drag Handle and Track Number */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          {...provided.dragHandleProps}
          className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing transition-all duration-200 p-1.5 sm:p-2 hover:bg-gray-700/50 rounded-lg flex-shrink-0"
          style={{ touchAction: 'none' }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Track Number */}
        <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 ${
          item.is_playing 
            ? 'bg-purple-500 text-white scale-110' 
            : 'bg-gray-700 text-gray-400'
        }`}>
          {index + 1}
        </div>
      </div>

      {/* Now Playing Indicator */}
      {item.is_playing && (
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-purple-500/30 rounded-lg border border-purple-400/50 animate-bounce-in flex-shrink-0">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-purple-300 animate-pulse">NOW PLAYING</span>
        </div>
      )}

      {/* Album Art and Track Info */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Album Art */}
        {!isDragging && (
          <>
            {item.track.cover_url ? (
              <TrackTooltip track={item.track} position="right">
                <img
                  src={item.track.cover_url}
                  alt={`${item.track.title} cover`}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 cursor-pointer"
                  loading="lazy"
                />
              </TrackTooltip>
            ) : (
              <TrackTooltip track={item.track} position="right">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 cursor-pointer">
                  {item.track.title.charAt(0)}
                </div>
              </TrackTooltip>
            )}
          </>
        )}
        {isDragging && (
          <>
            {item.track.cover_url ? (
              <img
                src={item.track.cover_url}
                alt={`${item.track.title} cover`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                {item.track.title.charAt(0)}
              </div>
            )}
          </>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold truncate transition-all duration-300 text-sm sm:text-base ${
            item.is_playing ? 'text-white' : 'text-gray-100 group-hover:text-white group-hover:translate-x-1'
          }`}>
            {item.track.title}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 truncate transition-colors duration-300 group-hover:text-gray-300">{item.track.artist}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {addedByUser ? (
                <UserAvatar name={addedByUser.name} avatar={addedByUser.avatar} size="sm" />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <span className="text-xs text-gray-500">
                Added by <span className="text-gray-400">{item.added_by}</span>
              </span>
            </div>
            <span className="text-xs text-gray-600 hidden sm:inline">•</span>
            <span className="text-xs text-gray-500 hidden sm:inline">{formatDuration(item.track.duration_seconds)}</span>
          </div>
        </div>
      </div>

      {/* Votes - Using track votes (persists across playlists) */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700/50 rounded-lg border border-gray-600 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(item.id, 'down');
          }}
          className="p-0.5 sm:p-1 text-gray-400 hover:text-red-400 transition-all duration-300 hover:bg-red-500/20 rounded hover:scale-125 active:scale-95"
          title="Downvote"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <span
          key={item.track.votes}
          className={`font-bold min-w-[2ch] sm:min-w-[3ch] text-center text-sm sm:text-lg transition-all duration-300 ${
            item.track.votes > 0
              ? 'text-green-400'
              : item.track.votes < 0
              ? 'text-red-400'
              : 'text-gray-400'
          } animate-vote-pop`}
        >
          {item.track.votes > 0 ? '+' : ''}
          {item.track.votes}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(item.id, 'up');
          }}
          className="p-0.5 sm:p-1 text-gray-400 hover:text-green-400 transition-all duration-300 hover:bg-green-500/20 rounded hover:scale-125 active:scale-95"
          title="Upvote"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end sm:justify-start w-full sm:w-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(item.id); }}
          className={`px-2 sm:px-4 py-1 sm:py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none ${
            item.is_playing
              ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:scale-105 active:scale-95'
          }`}
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.is_playing ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">{item.is_playing ? 'Playing' : 'Play'}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="px-2 sm:px-4 py-1 sm:py-1.5 sm:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-all duration-300 border border-red-500/30 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if relevant props change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.position === nextProps.item.position &&
    prevProps.item.is_playing === nextProps.item.is_playing &&
    prevProps.item.track.votes === nextProps.item.track.votes &&
    prevProps.snapshot.isDragging === nextProps.snapshot.isDragging &&
    prevProps.snapshot.isDropAnimating === nextProps.snapshot.isDropAnimating &&
    prevProps.index === nextProps.index
  );
});

function PlaylistPanel({ playlist, onRemove, onVote, onPlay, onSortByVotes, sortByVotes, onExport, activeUsers = [] }) {
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const totalDuration = useMemo(() => {
    return playlist.reduce(
      (sum, item) => sum + item.track.duration_seconds,
      0
    );
  }, [playlist]);

  // Memoize playlist to prevent unnecessary re-renders
  const memoizedPlaylist = useMemo(() => playlist, [playlist]);

  return (
    <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 animate-fade-in relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Playlist Queue</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={onSortByVotes}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none ${
                sortByVotes
                  ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600'
              } hover:scale-105 active:scale-95`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span className="hidden sm:inline">{sortByVotes ? 'Sorted by Votes' : 'Sort by Votes'}</span>
              <span className="sm:hidden">Sort</span>
            </button>
            <button
              onClick={onExport}
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-300 border border-gray-600 hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-300">{playlist.length} tracks</span>
            </div>
          </div>
        </div>

      <Droppable droppableId="playlist">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`min-h-[200px] sm:min-h-[300px] space-y-2 sm:space-y-3 rounded-lg transition-colors duration-200 ${
              snapshot.isDraggingOver 
                ? 'bg-purple-500/10 border-2 border-dashed border-purple-500 p-3 sm:p-4' 
                : 'p-1'
            } ${sortByVotes ? 'animate-sort-reorder' : ''}`}
          >
            {playlist.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="mt-4 text-gray-400 text-lg">Your playlist is empty</p>
                <p className="text-gray-500 text-sm mt-2">Add tracks from the library above</p>
              </div>
            ) : (
              memoizedPlaylist.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={sortByVotes}>
                  {(provided, snapshot) => (
                    <PlaylistTrackItem
                      item={item}
                      index={index}
                      provided={provided}
                      snapshot={snapshot}
                      formatDuration={formatDuration}
                      onRemove={onRemove}
                      onVote={onVote}
                      onPlay={onPlay}
                      activeUsers={activeUsers}
                    />
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Total Duration */}
      {playlist.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 px-2 sm:px-4 py-2 sm:py-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-400">
                {playlist.length} track{playlist.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="font-bold text-white text-base sm:text-lg">
              Total: {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default memo(PlaylistPanel);
