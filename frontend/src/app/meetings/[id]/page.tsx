

'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import VirtualPlayer, {
  VirtualPlayerHandle,
} from '@/components/VirtualPlayer';

import TranscriptPanel from '@/components/TranscriptPanel';
import SummaryPanel from '@/components/SummaryPanel';
import MeetingFormModal from '@/components/MeetingFormModal';

import {
  fetchMeeting,
  deleteMeeting,
  API_BASE_URL,
} from '@/lib/api';

import { MeetingDetail } from '@/lib/types';

import { useToast } from '@/components/Toast';

import {
  formatDateTime,
  formatDuration,
} from '@/lib/utils';

import Avatar from '@/components/Avatar';

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();

  const meetingId = Number(params.id);

  const playerRef = useRef<VirtualPlayerHandle>(null);

  const [meeting, setMeeting] =
    useState<MeetingDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [isEditOpen, setIsEditOpen] =
    useState(false);

  const [showExport, setShowExport] =
    useState(false);

  const exportRef =
    useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        exportRef.current &&
        !exportRef.current.contains(e.target as Node)
      ) {
        setShowExport(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handler
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handler
      );
  }, []);

  const loadMeeting = useCallback(async () => {
    try {
      const data = await fetchMeeting(meetingId);
      setMeeting(data);
    } catch (err: any) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to load meeting'
      );

      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [meetingId, router, showToast]);

  useEffect(() => {
    if (!Number.isFinite(meetingId)) {
      router.push('/');
      return;
    }

    loadMeeting();
  }, [meetingId, loadMeeting, router]);

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
  }, []);

  const handleDelete = async () => {
    if (!meeting) return;

    if (
      !window.confirm(
        `Delete "${meeting.title}"?`
      )
    )
      return;

    try {
      await deleteMeeting(meeting.id);

      showToast(
        'success',
        'Meeting deleted'
      );

      router.push('/');
    } catch (err: any) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Delete failed'
      );
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-6">

        <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />

        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />

        <div className="grid grid-cols-3 gap-6">

          <div className="col-span-2 h-[550px] animate-pulse rounded-xl bg-gray-100" />

          <div className="h-[550px] animate-pulse rounded-xl bg-gray-100" />

        </div>

      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="flex h-screen flex-col bg-fireflies-content-bg">

      <header className="border-b border-gray-200 bg-white">

        <div className="page-container flex items-start justify-between">

          <div>

            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm text-fireflies-primary"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Link>

            <h1 className="text-2xl font-bold">
              {meeting.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-fireflies-text-secondary">

              <span>
                {formatDateTime(meeting.date)}
              </span>

              <span className="flex items-center gap-1">

                <ClockIcon className="h-4 w-4" />

                {formatDuration(
                  meeting.duration_seconds
                )}

              </span>

              <div className="flex -space-x-2">

                {meeting.participants.map((p) => (
                  <Avatar key={p.id} name={p.name} color={p.avatar_color} />
                ))}

              </div>

            </div>

          </div>

          <div className="flex gap-2">

            <div
              className="relative"
              ref={exportRef}
            >
              <button
                onClick={() => setShowExport((v) => !v)}
                className="secondary-button flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </button>

              {showExport && (
                <div
                  className="
                    absolute
                    right-0
                    top-12
                    z-30
                    w-56
                    overflow-hidden
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    shadow-lg
                  "
                >
                  <a
                    href={`${API_BASE_URL}/meetings/${meeting.id}/export?format=md`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowExport(false)}
                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    Markdown (.md)
                  </a>

                  <a
                    href={`${API_BASE_URL}/meetings/${meeting.id}/export?format=txt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowExport(false)}
                    className="block border-t border-gray-100 px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    Plain Text (.txt)
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsEditOpen(true)}
              className="secondary-button flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>

            <button
              onClick={handleDelete}
              className="
                rounded-lg
                border
                border-red-200
                px-4
                py-2
                text-sm
                font-medium
                text-red-600
                transition
                hover:bg-red-50
              "
            >
              <TrashIcon className="mr-2 inline h-4 w-4" />
              Delete
            </button>

          </div>

        </div>

      </header>

      <VirtualPlayer
        ref={playerRef}
        durationSeconds={meeting.duration_seconds}
        topics={meeting.topics}
        onTimeUpdate={setCurrentTime}
      />

      <div className="flex min-h-0 flex-1">

        <div className="w-[60%] border-r border-gray-200 bg-white">

          <TranscriptPanel
            segments={meeting.transcript_segments}
            currentTime={currentTime}
            onSeek={handleSeek}
          />

        </div>

        <div className="w-[40%] overflow-y-auto bg-fireflies-content-bg p-5">

          <SummaryPanel
            summary={meeting.summary}
            actionItems={meeting.action_items}
            topics={meeting.topics}
            participants={meeting.participants}
            onSeek={handleSeek}
            onActionItemsChange={loadMeeting}
          />

        </div>

      </div>

      <MeetingFormModal
        isOpen={isEditOpen}
        editMeeting={meeting}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          loadMeeting();
        }}
      />

    </div>
  );
}