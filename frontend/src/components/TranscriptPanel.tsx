'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { TranscriptSegment } from '@/lib/types';
import { formatTime, getInitials } from '@/lib/utils';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function TranscriptPanel({
  segments,
  currentTime,
  onSeek,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query to avoid re-rendering on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setActiveMatchIndex(0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Find the currently active segment based on player time
  const activeSegmentId = useMemo(() => {
    // Walk backwards from the end to find the segment whose start_time <= currentTime
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (currentTime >= seg.start_time_seconds && currentTime < seg.end_time_seconds) {
        return seg.id;
      }
    }
    // If currentTime is before all segments or no match, return the first one
    if (segments.length > 0 && currentTime < segments[0].start_time_seconds) {
      return null;
    }
    return null;
  }, [segments, currentTime]);

  // Auto-scroll to the active segment when it changes
  useEffect(() => {
    if (activeSegmentId == null) return;
    const el = segmentRefs.current.get(activeSegmentId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSegmentId]);

  // Compute matching segments and the positions of each match within segment text
  const matchData = useMemo(() => {
    if (!debouncedQuery) return { matches: [], totalCount: 0 };

    const lowerQuery = debouncedQuery.toLowerCase();
    const matches: { segmentId: number; segmentIndex: number }[] = [];

    segments.forEach((seg, segIdx) => {
      const text = seg.text.toLowerCase();
      let startPos = 0;
      while (true) {
        const idx = text.indexOf(lowerQuery, startPos);
        if (idx === -1) break;
        matches.push({ segmentId: seg.id, segmentIndex: segIdx });
        startPos = idx + 1;
      }
    });

    return { matches, totalCount: matches.length };
  }, [segments, debouncedQuery]);

  // Jump to next/prev match
  const goToMatch = useCallback(
    (direction: 'next' | 'prev') => {
      if (matchData.totalCount === 0) return;
      setActiveMatchIndex((prev) => {
        const next =
          direction === 'next'
            ? (prev + 1) % matchData.totalCount
            : (prev - 1 + matchData.totalCount) % matchData.totalCount;
        // Scroll to the segment containing this match
        const match = matchData.matches[next];
        if (match) {
          const el = segmentRefs.current.get(match.segmentId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return next;
      });
    },
    [matchData]
  );

  // Highlight matching text in a segment, wrapping matches in <mark>
  const highlightText = useCallback(
    (text: string) => {
      if (!debouncedQuery) return text;

      const parts: React.ReactNode[] = [];
      const lowerText = text.toLowerCase();
      const lowerQuery = debouncedQuery.toLowerCase();
      let lastIndex = 0;

      while (true) {
        const idx = lowerText.indexOf(lowerQuery, lastIndex);
        if (idx === -1) break;

        // Text before the match
        if (idx > lastIndex) {
          parts.push(text.slice(lastIndex, idx));
        }

        // The matched text, highlighted
        parts.push(
          <mark
            key={`${idx}-${lastIndex}`}
            className="bg-yellow-200 text-fireflies-text-primary rounded-sm px-0.5"
          >
            {text.slice(idx, idx + debouncedQuery.length)}
          </mark>
        );

        lastIndex = idx + debouncedQuery.length;
      }

      // Remaining text after last match
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    },
    [debouncedQuery]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search bar within transcript */}
      <div className="px-4 py-3 border-b border-fireflies-border bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fireflies-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript..."
              className="
                w-full pl-9 pr-3 py-2
                bg-fireflies-content-bg border border-transparent rounded-lg
                text-sm text-fireflies-text-primary placeholder:text-fireflies-text-muted
                focus:outline-none focus:border-fireflies-primary focus:bg-white
                transition-all duration-200
              "
            />
          </div>
          {debouncedQuery && (
            <>
              <span className="text-xs text-fireflies-text-muted whitespace-nowrap">
                {matchData.totalCount > 0
                  ? `${activeMatchIndex + 1} of ${matchData.totalCount}`
                  : 'No matches'}
              </span>
              <div className="flex items-center">
                <button
                  onClick={() => goToMatch('prev')}
                  disabled={matchData.totalCount === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  aria-label="Previous match"
                >
                  <ChevronUpIcon className="h-4 w-4 text-fireflies-text-secondary" />
                </button>
                <button
                  onClick={() => goToMatch('next')}
                  disabled={matchData.totalCount === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  aria-label="Next match"
                >
                  <ChevronDownIcon className="h-4 w-4 text-fireflies-text-secondary" />
                </button>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-4 w-4 text-fireflies-text-muted" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript segments */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {segments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-fireflies-text-muted text-sm">No transcript available.</p>
          </div>
        ) : (
          segments.map((segment) => {
            const isActive = segment.id === activeSegmentId;
            return (
              <div
                key={segment.id}
                ref={(el) => {
                  if (el) {
                    segmentRefs.current.set(segment.id, el);
                  } else {
                    segmentRefs.current.delete(segment.id);
                  }
                }}
                onClick={() => onSeek(segment.start_time_seconds)}
                className={`
                  flex gap-3 p-3 rounded-lg cursor-pointer
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-fireflies-primary-light/60 border-l-[3px] border-fireflies-primary'
                      : 'hover:bg-gray-50 border-l-[3px] border-transparent'
                  }
                `}
              >
                {/* Speaker avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: segment.speaker?.avatar_color ?? '#9CA3AF',
                  }}
                >
                  {getInitials(segment.speaker.name ?? 'Unknown')}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Speaker name + timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-fireflies-text-primary">
                      {segment.speaker.name ?? 'Unknown Speaker'}
                    </span>
                    <span className="text-xs text-fireflies-primary font-mono group-hover:underline">
                      {formatTime(segment.start_time_seconds)}
                    </span>
                  </div>

                  {/* Segment text with search highlighting */}
                  <p className="text-sm text-fireflies-text-secondary leading-relaxed">
                    {highlightText(segment.text)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
