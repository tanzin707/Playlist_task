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
      className={`group flex items-center gap-4 px-4 py-2 rounded-lg transition-colors ${
        isDragging 
          ? 'opacity-50 bg-[#272727]'
          : item.is_playing
          ? 'bg-[#272727]'
          : 'hover:bg-[#272727]'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...provided.dragHandleProps}
        className="text-[#717171] hover:text-white cursor-grab active:cursor-grabbing transition-colors"
        style={{ touchAction: 'none' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Track Number */}
      <div className={`w-6 text-center text-sm font-medium transition-colors ${
        item.is_playing 
          ? 'text-white' 
          : 'text-[#717171]'
      }`}>
        {index + 1}
      </div>

      {/* Album Art */}
      {!isDragging && (
        <>
          {item.track.cover_url ? (
            <TrackTooltip track={item.track} position="right">
              <img
                src={item.track.cover_url}
                alt={`${item.track.title} cover`}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                loading="lazy"
              />
            </TrackTooltip>
          ) : (
            <TrackTooltip track={item.track} position="right">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg cursor-pointer">
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
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
              {item.track.title.charAt(0)}
            </div>
          )}
        </>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate transition-colors ${
          item.is_playing ? 'text-white' : 'text-[#f1f1f1]'
        }`}>
          {item.track.title}
        </div>
        <div className="text-sm text-[#aaaaaa] truncate">{item.track.artist}</div>
      </div>

      {/* Votes */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(item.id, 'down');
          }}
          className="p-1.5 text-[#aaaaaa] hover:text-white transition-colors"
          title="Downvote"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <span className={`font-medium min-w-[3ch] text-center text-sm ${
          item.track.votes > 0
            ? 'text-white'
            : item.track.votes < 0
            ? 'text-[#aaaaaa]'
            : 'text-[#717171]'
        }`}>
          {item.track.votes > 0 ? '+' : ''}{item.track.votes}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(item.id, 'up');
          }}
          className="p-1.5 text-[#aaaaaa] hover:text-white transition-colors"
          title="Upvote"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Duration */}
      <span className="text-sm text-[#aaaaaa] font-mono w-14 text-right">{formatDuration(item.track.duration_seconds)}</span>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(item.id); }}
          className={`p-2 rounded-full transition-colors ${
            item.is_playing
              ? 'text-white'
              : 'text-[#aaaaaa] hover:text-white hover:bg-[#272727]'
          }`}
        >
          {item.is_playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="p-2 text-[#aaaaaa] hover:text-white hover:bg-[#272727] rounded-full transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Playlist Queue</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onSortByVotes}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              sortByVotes
                ? 'bg-white text-black'
                : 'bg-[#272727] text-[#f1f1f1] hover:bg-[#3d3d3d]'
            }`}
          >
            Sort by Votes
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-[#272727] text-[#f1f1f1] rounded-full text-sm font-medium hover:bg-[#3d3d3d] transition-colors"
          >
            Export
          </button>
          <div className="text-sm text-[#aaaaaa]">{playlist.length} tracks</div>
        </div>
      </div>

      <Droppable droppableId="playlist">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-1 transition-colors duration-200 ${
              snapshot.isDraggingOver 
                ? 'bg-[#272727]/50 rounded-lg p-2' 
                : ''
            }`}
          >
            {playlist.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#aaaaaa] text-lg">Your playlist is empty</p>
                <p className="text-[#717171] text-sm mt-2">Add tracks from the library above</p>
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
        <div className="mt-6 pt-4 border-t border-[#272727]">
          <div className="flex justify-between items-center px-4 py-2 text-sm text-[#aaaaaa]">
            <span>Total duration</span>
            <span className="font-mono">{formatDuration(totalDuration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PlaylistPanel);
