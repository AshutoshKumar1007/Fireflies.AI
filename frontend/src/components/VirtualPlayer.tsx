'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { formatTime } from '@/lib/utils';
import { Topic } from '@/lib/types';

/* ===== Public handle for parent components to call seekTo imperatively ===== */
export interface VirtualPlayerHandle {
  seekTo: (time: number) => void;
}

interface VirtualPlayerProps {
  durationSeconds: number;
  topics: Topic[];
  /** Called every time currentTime changes so parent can sync transcript highlighting */
  onTimeUpdate: (time: number) => void;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

const VirtualPlayer = forwardRef<VirtualPlayerHandle, VirtualPlayerProps>(
  function VirtualPlayer({ durationSeconds, topics, onTimeUpdate }, ref) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const speedMenuRef = useRef<HTMLDivElement>(null);

    // Expose seekTo to parent via ref
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        const clamped = Math.max(0, Math.min(time, durationSeconds));
        setCurrentTime(clamped);
        onTimeUpdate(clamped);
      },
    }));

    // Core playback loop: increment currentTime at the configured speed
    useEffect(() => {
      if (isPlaying) {
        intervalRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + playbackSpeed;
            if (next >= durationSeconds) {
              // Reached the end — stop playback
              setIsPlaying(false);
              return durationSeconds;
            }
            return next;
          });
        }, 1000);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [isPlaying, playbackSpeed, durationSeconds]);

    // Notify parent whenever currentTime changes
    useEffect(() => {
      onTimeUpdate(currentTime);
    }, [currentTime, onTimeUpdate]);

    // Close speed menu on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
          setShowSpeedMenu(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const togglePlayPause = useCallback(() => {
      if (currentTime >= durationSeconds) {
        // If at end, restart
        setCurrentTime(0);
        onTimeUpdate(0);
      }
      setIsPlaying((prev) => !prev);
    }, [currentTime, durationSeconds, onTimeUpdate]);

    const handleSeek = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = Number(e.target.value);
        setCurrentTime(newTime);
        onTimeUpdate(newTime);
      },
      [onTimeUpdate]
    );

    const handleSpeedSelect = (speed: number) => {
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    };

    // Calculate progress percentage for the seek bar fill
    const progressPercent =
      durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

    return (
      <div className="bg-white border-b border-fireflies-border px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Play / Pause button */}
          <button
            onClick={togglePlayPause}
            className="
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              bg-fireflies-primary hover:bg-fireflies-primary-hover
              text-white transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-fireflies-primary/40
            "
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5 ml-0.5" />
            )}
          </button>

          {/* Current time */}
          <span className="text-xs font-mono text-fireflies-text-secondary w-12 text-right flex-shrink-0">
            {formatTime(currentTime)}
          </span>

          {/* Seek bar with topic markers */}
          <div className="relative flex-1 group">
            {/* Topic markers */}
            {topics.map((topic) => {
              const pct =
                durationSeconds > 0
                  ? (topic.start_time_seconds / durationSeconds) * 100
                  : 0;
              return (
                <div
                  key={topic.id}
                  className="absolute top-1/2 -translate-y-1/2 z-10 group/marker"
                  style={{ left: `${pct}%` }}
                >
                  <div className="w-1.5 h-3 bg-fireflies-primary/70 rounded-full -translate-x-1/2 cursor-pointer hover:bg-fireflies-primary hover:scale-125 transition-all" />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none">
                    {topic.title}
                  </div>
                </div>
              );
            })}

            {/* Progress fill (beneath the range input) */}
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none w-full">
              <div className="h-1.5 rounded-full bg-gray-200 w-full">
                <div
                  className="h-full rounded-full bg-fireflies-primary transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Range input */}
            <input
              type="range"
              min={0}
              max={durationSeconds}
              step={1}
              value={currentTime}
              onChange={handleSeek}
              className="relative z-20 w-full opacity-0 cursor-pointer h-6"
              aria-label="Seek"
            />
          </div>

          {/* Total time */}
          <span className="text-xs font-mono text-fireflies-text-secondary w-12 flex-shrink-0">
            {formatTime(durationSeconds)}
          </span>

          {/* Playback speed selector */}
          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setShowSpeedMenu((prev) => !prev)}
              className="
                px-2.5 py-1 rounded-lg text-xs font-semibold
                bg-gray-100 text-fireflies-text-secondary
                hover:bg-gray-200 hover:text-fireflies-text-primary
                transition-colors duration-150
                focus:outline-none
              "
            >
              {playbackSpeed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-fireflies-border rounded-lg shadow-lg overflow-hidden z-30 animate-scale-in">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedSelect(speed)}
                    className={`
                      block w-full px-4 py-1.5 text-xs text-left
                      transition-colors duration-100
                      ${
                        speed === playbackSpeed
                          ? 'bg-fireflies-primary-light text-fireflies-primary font-semibold'
                          : 'text-fireflies-text-secondary hover:bg-gray-50'
                      }
                    `}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default VirtualPlayer;
