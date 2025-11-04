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
    <div className="fixed bottom-0 left-0 right-0 bg-[#030303] border-t border-[#272727] text-white z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {track.track.cover_url ? (
              <TrackTooltip track={track.track} position="top">
                <img
                  src={track.track.cover_url}
                  alt={`${track.track.title} cover`}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                />
              </TrackTooltip>
            ) : (
              <TrackTooltip track={track.track} position="top">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 cursor-pointer">
                  {track.track.title.charAt(0)}
                </div>
              </TrackTooltip>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white truncate">{track.track.title}</div>
              <div className="text-sm text-[#aaaaaa] truncate">{track.track.artist}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-white text-black rounded-full hover:bg-[#f1f1f1] transition-colors flex items-center justify-center flex-shrink-0"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
            <button
              onClick={onSkip}
              className="w-10 h-10 flex items-center justify-center text-[#aaaaaa] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#aaaaaa] font-mono w-12 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-[#272727] rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.min(Math.max(0, x / rect.width), 1);
                setProgress(percent);
                progressRef.current = percent;
                const durationMs = track.track.duration_seconds * 1000;
                startTimeRef.current = Date.now() - (percent * durationMs);
              }}>
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-[#aaaaaa] font-mono w-12">{formatTime(remainingTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(NowPlayingBar);

