'use client';

import { useEffect, useState, useRef, memo, useMemo, useCallback } from 'react';
import TrackTooltip from './TrackTooltip';

function NowPlayingBar({ track, onSkip }) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const startTimeRef = useRef(Date.now());
  const progressRef = useRef(0);

  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
    setIsPlaying(true);
    startTimeRef.current = Date.now();
  }, [track.id]);

  useEffect(() => {
    if (!isPlaying) return;

    const durationMs = track.track.duration_seconds * 1000;
    const initialProgress = progressRef.current;
    const adjustedStartTime = Date.now() - (initialProgress * durationMs);
    startTimeRef.current = adjustedStartTime;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(elapsed / durationMs, 1);
      progressRef.current = newProgress;
      
      if (newProgress >= 1) {
        // Auto-advance to next track
        setProgress(0);
        progressRef.current = 0;
        setIsPlaying(false);
        onSkip();
      } else {
        setProgress(newProgress);
      }
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [isPlaying, track.track.duration_seconds, track.id, onSkip]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const { currentTime, remainingTime } = useMemo(() => {
    const current = progress * track.track.duration_seconds;
    const remaining = track.track.duration_seconds - current;
    return { currentTime: current, remainingTime: remaining };
  }, [progress, track.track.duration_seconds]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 text-white shadow-2xl border-t border-gray-700/50 backdrop-blur-md animate-slide-in-up z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          {/* Track Info */}
          <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {track.track.cover_url ? (
              <TrackTooltip track={track.track} position="top">
                <img
                  src={track.track.cover_url}
                  alt={`${track.track.title} cover`}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shadow-lg flex-shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-6 animate-float cursor-pointer"
                />
              </TrackTooltip>
            ) : (
              <TrackTooltip track={track.track} position="top">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-6 animate-float cursor-pointer">
                  {track.track.title.charAt(0)}
                </div>
              </TrackTooltip>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-base sm:text-lg truncate transition-all duration-300">{track.track.title}</div>
              <div className="text-xs sm:text-sm text-gray-400 truncate transition-colors duration-300">{track.track.artist}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center hover:shadow-xl hover:shadow-white/50 flex-shrink-0"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
            <button
              onClick={onSkip}
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-110 active:scale-95 flex items-center gap-2 relative overflow-hidden group text-sm sm:text-base"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="relative z-10">Skip</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 w-full sm:w-auto sm:max-w-md">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="text-gray-400 font-mono w-10 sm:w-12 text-right transition-all duration-300 text-xs sm:text-sm">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1.5 sm:h-2 bg-gray-700/80 rounded-full overflow-hidden cursor-pointer group relative" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.min(Math.max(0, x / rect.width), 1);
                setProgress(percent);
                progressRef.current = percent;
                // Reset start time based on new progress
                const durationMs = track.track.duration_seconds * 1000;
                startTimeRef.current = Date.now() - (percent * durationMs);
              }}>
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:from-purple-400 group-hover:to-pink-400 relative overflow-hidden"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
              </div>
              <span className="text-gray-400 font-mono w-10 sm:w-12 transition-all duration-300 text-xs sm:text-sm">{formatTime(remainingTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(NowPlayingBar);

