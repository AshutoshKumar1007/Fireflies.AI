
// app/page.tsx (PART 1)

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import SearchBar from '@/components/SearchBar';
import MeetingCard from '@/components/MeetingCard';
import MeetingFormModal from '@/components/MeetingFormModal';

import { fetchMeetings, deleteMeeting } from '@/lib/api';
import { Meeting } from '@/lib/types';
import { useToast } from '@/components/Toast';

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [participantId, setParticipantId] = useState<number | undefined>();
  const [sortOrder, setSortOrder] = useState('date_desc');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showToast } = useToast();

  const loadMeetings = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchMeetings({
        search: searchQuery,
        participant: participantId,
        sort: sortOrder,
      });

      setMeetings(data);
    } catch (err: any) {
      showToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Failed to fetch meetings'
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, participantId, sortOrder, showToast]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleDeleteMeeting = async (
    id: number,
    title: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      await deleteMeeting(id);

      showToast('success', 'Meeting deleted');

      loadMeetings();
    } catch (err: any) {
      showToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Delete failed'
      );
    }
  };

  const stats = useMemo(() => {
    const duration = meetings.reduce(
      (acc, m) => acc + m.duration_seconds,
      0
    );

    const participants = new Set<number>();

    meetings.forEach((m) =>
      m.participants.forEach((p) => participants.add(p.id))
    );

    return {
      meetings: meetings.length,
      hours: (duration / 3600).toFixed(1),
      participants: participants.size,
    };
  }, [meetings]);

  return (
    <div className="min-h-screen bg-fireflies-content-bg">

      <header className="border-b border-gray-200 bg-white">
        <div className="page-container flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              Meetings
            </h1>

            <p className="mt-1 text-sm text-fireflies-text-secondary">
              Browse transcripts, summaries and recordings.
            </p>
          </div>

          <div className="flex gap-2">

            <button
              onClick={loadMeetings}
              className="secondary-button flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="primary-button flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              New Meeting
            </button>

          </div>

        </div>
      </header>

      <main className="page-container space-y-6">

        <div className="grid grid-cols-3 gap-4">

          <div className="surface p-5">
            <p className="text-xs uppercase tracking-wide text-fireflies-text-secondary">
              Meetings
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {stats.meetings}
            </h2>
          </div>

          <div className="surface p-5">
            <p className="text-xs uppercase tracking-wide text-fireflies-text-secondary">
              Hours
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {stats.hours}
            </h2>
          </div>

          <div className="surface p-5">
            <p className="text-xs uppercase tracking-wide text-fireflies-text-secondary">
              Participants
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {stats.participants}
            </h2>
          </div>

        </div>

        <div className="surface p-4">

          <SearchBar
            onSearchChange={setSearchQuery}
            onParticipantFilter={setParticipantId}
            onSortChange={setSortOrder}
            currentSort={sortOrder}
          />

        </div>
        {/* // app/page.tsx (PART 2) */}

        {loading ? (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="surface h-[230px] animate-pulse p-6"
              >
                <div className="h-5 w-24 rounded bg-gray-200" />

                <div className="mt-4 h-7 w-3/4 rounded bg-gray-200" />

                <div className="mt-3 h-4 w-full rounded bg-gray-100" />
                <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-2/3 rounded bg-gray-100" />

                <div className="mt-8 flex justify-between">

                  <div className="flex gap-2">

                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="h-8 w-8 rounded-full bg-gray-200" />

                  </div>

                  <div className="h-6 w-20 rounded-full bg-gray-100" />

                </div>
              </div>
            ))}

          </div>

        ) : meetings.length === 0 ? (

          <div className="surface py-20 text-center">

            <h2 className="text-xl font-semibold">
              No meetings yet
            </h2>

            <p className="mt-2 text-sm text-fireflies-text-secondary">
              Upload a transcript to create your first meeting.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="primary-button mt-6"
            >
              Create Meeting
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {meetings.map((meeting) => (

              <div
                key={meeting.id}
                className="group relative"
              >

                <MeetingCard
                  meeting={meeting}
                />

                <button
                  title="Delete meeting"
                  onClick={(e) =>
                    handleDeleteMeeting(
                      meeting.id,
                      meeting.title,
                      e
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-4
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    p-2
                    opacity-0
                    shadow-sm
                    transition
                    group-hover:opacity-100
                  "
                >
                  <TrashIcon className="h-4 w-4 text-gray-500 hover:text-red-500" />
                </button>

              </div>

            ))}

          </div>

        )}

      </main>
      {/* // app/page.tsx (PART 3 — END) */}

      <MeetingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadMeetings();
        }}
      />

    </div>
  );
}