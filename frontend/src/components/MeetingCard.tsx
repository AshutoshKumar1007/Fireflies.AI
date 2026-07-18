
// components/MeetingCard.tsx

'use client';

import Link from 'next/link';
import {
  ClockIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { Meeting } from '@/lib/types';
import {
  formatDateTime,
  formatDuration,
  getInitials,
} from '@/lib/utils';

interface Props {
  meeting: Meeting;
}

export default function MeetingCard({ meeting }: Props) {
  const preview =
    meeting.summary?.overview_text
      ?.split('\n')
      .find((line) => line.trim().length > 0) ??
    'No summary available.';

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="
        group flex h-full flex-col rounded-2xl
        border border-gray-200 bg-white
        transition-all duration-150
        hover:border-gray-300 hover:shadow-md
      "
    >
      <div className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-fireflies-text-secondary">
            {formatDateTime(meeting.date)}
          </p>

          <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold text-fireflies-text-primary">
            {meeting.title}
          </h3>
        </div>

        <ChevronRightIcon
          className="
            h-5 w-5 flex-shrink-0
            text-gray-300
            transition-transform duration-150
            group-hover:translate-x-1
          "
        />
      </div>

      <div className="px-5">
        <p className="line-clamp-3 text-sm leading-6 text-fireflies-text-secondary">
          {preview}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-5 border-t border-gray-100 px-5 py-4 text-sm text-fireflies-text-secondary">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4" />
          <span>{formatDuration(meeting.duration_seconds)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <UserGroupIcon className="h-4 w-4" />
          <span>{meeting.participants.length}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between px-5 pb-5">
        <div className="flex -space-x-2">
          {meeting.participants.length === 0 && (
              <div className="text-xs text-fireflies-text-secondary">
                  No participants
              </div>
          )}
          {meeting.participants.slice(0, 4).map((participant) => (
            <div
              key={participant.id}
              title={participant.name}
              style={{ backgroundColor: participant.avatar_color }}
              className="
                flex h-8 w-8 items-center justify-center
                rounded-full
                border-2 border-white
                text-[11px] font-semibold text-white
              "
            >
              {getInitials(participant.name)}
            </div>
          ))}

          {meeting.participants.length > 4 && (
            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-full border-2 border-white
                bg-gray-100 text-[11px] font-medium text-gray-600
              "
            >
              +{meeting.participants.length - 4}
            </div>
          )}
        </div>

        <span
          className="
            rounded-full
            bg-fireflies-primary-light
            px-2.5 py-1
            text-xs font-medium
            text-fireflies-primary
          "
        >
          Transcript
        </span>
      </div>
    </Link>
  );
}