'use client';

import { useState, useRef, useEffect } from 'react';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TrackTooltip({ track, children, position = 'right' }) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      setIsPositioned(false);
      // Use a small delay to ensure tooltip is rendered before calculating position
      const timeoutId = setTimeout(() => {
        if (tooltipRef.current && triggerRef.current) {
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;

          let top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
          let left;

          if (position === 'right') {
            left = triggerRect.right + scrollX + 12;
          } else if (position === 'left') {
            left = triggerRect.left + scrollX - tooltipRect.width - 12;
          } else if (position === 'top') {
            left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
            top = triggerRect.top + scrollY - tooltipRect.height - 12;
          } else { // bottom
            left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
            top = triggerRect.bottom + scrollY + 12;
          }

          // Keep tooltip within viewport
          const padding = 16;
          if (left < padding) left = padding;
          if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - tooltipRect.width - padding;
          }
          if (top < padding) top = padding;
          if (top + tooltipRect.height > window.innerHeight + scrollY - padding) {
            top = window.innerHeight + scrollY - tooltipRect.height - padding;
          }

          setTooltipPosition({ top, left });
          setIsPositioned(true);
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    } else {
      setIsPositioned(false);
      setTooltipPosition({ top: 0, left: 0 });
    }
  }, [isHovered, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative"
      >
        {children}
      </div>
      {isHovered && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 pointer-events-none animate-fade-in-scale transition-opacity duration-200 ${
            isPositioned ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            visibility: tooltipPosition.top === 0 && tooltipPosition.left === 0 ? 'hidden' : 'visible',
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-2xl shadow-purple-500/20 min-w-[280px] max-w-[320px] animate-slide-in-fade">
            {/* Album Art */}
            {track.cover_url ? (
              <div className="mb-3 relative">
                <img
                  src={track.cover_url}
                  alt={`${track.title} cover`}
                  className="w-full h-auto rounded-lg object-cover shadow-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent rounded-lg" />
              </div>
            ) : (
              <div className="mb-3 w-full aspect-square rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl shadow-xl">
                {track.title?.charAt(0) || '?'}
              </div>
            )}

            {/* Track Info */}
            <div className="space-y-2">
              <div>
                <h3 className="font-bold text-white text-lg truncate mb-1">
                  {track.title}
                </h3>
                <p className="text-purple-300 font-medium text-sm truncate">
                  {track.artist}
                </p>
              </div>

              {/* Album */}
              {track.album && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="truncate">{track.album}</span>
                </div>
              )}

              {/* Genre & Duration */}
              <div className="flex items-center gap-3 flex-wrap">
                {track.genre && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                    {track.genre}
                  </span>
                )}
                {track.duration_seconds && (
                  <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(track.duration_seconds)}
                  </span>
                )}
              </div>

              {/* Votes */}
              {track.votes !== undefined && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1.5 ${
                    track.votes > 0
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : track.votes < 0
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      {track.votes > 0 ? (
                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 011.414 0L10 15.586l5.293-5.879a1 1 0 111.414 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414z" clipRule="evenodd" />
                      ) : track.votes < 0 ? (
                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 14.586l5.293-5.879a1 1 0 011.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>{track.votes > 0 ? '+' : ''}{track.votes}</span>
                  </div>
                  <span className="text-xs text-gray-500">votes</span>
                </div>
              )}
            </div>

            {/* Decorative glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none -z-10" />
          </div>
        </div>
      )}
    </>
  );
}

