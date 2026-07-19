'use client';

import { useMemo, useState } from 'react';

import {
  CheckCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

import { updateActionItem } from '@/lib/api';
import {
  ActionItem,
  Participant,
  Topic,
  Summary,
} from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { useToast } from './Toast';
import Avatar from './Avatar';

interface Props {
  summary: Summary | null;
  actionItems: ActionItem[];
  topics: Topic[];
  participants: Participant[];
  onSeek: (time: number) => void;
  onActionItemsChange: () => void;
}

export default function SummaryPanel({
  summary,
  actionItems,
  topics,
  participants,
  onSeek,
  onActionItemsChange,
}: Props) {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const completed = useMemo(
  () => actionItems.filter((a) => a.is_completed).length,
  [actionItems]
);

  async function toggle(item: ActionItem) {
    try {
      setSaving(true);

      await updateActionItem(item.id, {
          is_completed: !item.is_completed,
      });

      onActionItemsChange();
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Failed to update action item'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">

      <section className="surface p-5">

        <div className="mb-4 flex items-center gap-2">

          <SparklesIcon className="h-5 w-5 text-fireflies-primary" />

          <h2 className="text-lg font-semibold">
            Summary
          </h2>

        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-fireflies-text-secondary">
          {summary?.overview_text || 'No summary available.'}
        </div>

      </section>

      <section className="surface p-5">

        <div className="mb-4 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />

            <h2 className="text-lg font-semibold">
              Action Items
            </h2>

          </div>

          <span className="badge">
            {completed}/{actionItems.length}
          </span>

        </div>

        <div className="space-y-3">

          {actionItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-fireflies-text-secondary">
              No action items found.
            </div>
          )}

          {actionItems.map((item) => (
            <button
              key={item.id}
              disabled={saving}
              onClick={() => toggle(item)}
              className="
                flex
                w-full
                items-start
                gap-3
                rounded-xl
                border
                border-gray-200
                p-3
                text-left
                transition
                hover:border-gray-300
                hover:bg-gray-50
              "
            >
              <input
                type="checkbox"
                checked={item.is_completed}
                readOnly
                className="mt-1"
              />

              <div className="min-w-0 flex-1">

                <p
                  className={
                    item.is_completed
                      ? 'text-sm text-gray-400 line-through'
                      : 'text-sm text-fireflies-text-primary'
                  }
                >
                  {item.text}
                </p>

                {item.assignee && (
                  <p className="mt-1 text-xs text-fireflies-text-secondary">
                    Assigned to {item.assignee.name}
                  </p>
                )}

              </div>

            </button>
          ))}

        </div>

      </section>

      <section className="surface p-5">

        <div className="mb-4 flex items-center gap-2">

          <TagIcon className="h-5 w-5 text-fireflies-primary" />

          <h2 className="text-lg font-semibold">
            Topics
          </h2>

        </div>

        <div className="space-y-2">
          {topics.length === 0 && (
            <p className="text-sm text-fireflies-text-secondary">
              No topics detected.
            </p>
          )}

          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSeek(topic.start_time_seconds)}
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                border-gray-200
                px-3
                py-2.5
                text-left
                transition
                hover:border-gray-300
                hover:bg-gray-50
              "
            >
              <span className="font-medium text-fireflies-text-primary">
                {topic.title}
              </span>

              <span className="text-xs text-fireflies-text-secondary">
                {formatTime(topic.start_time_seconds)}
              </span>
            </button>
          ))}

        </div>

      </section>

      <section className="surface p-5">

        <div className="mb-4 flex items-center gap-2">

          <UserGroupIcon className="h-5 w-5 text-fireflies-primary" />

          <h2 className="text-lg font-semibold">
            Participants
          </h2>

        </div>

        <div className="space-y-2">

          {participants.length === 0 && (
            <p className="text-sm text-fireflies-text-secondary">
              No participants available.
            </p>
          )}

          {participants.map((participant) => (
            <div
              key={participant.id}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-gray-200
                px-3
                py-2.5
              "
            >
              <Avatar name={participant.name} color={participant.avatar_color} size="lg" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fireflies-text-primary">
                  {participant.name}
                </p>

                {participant.email && (
                  <p className="truncate text-xs text-fireflies-text-secondary">
                    {participant.email}
                  </p>
                )}
              </div>
            </div>
          ))}

        </div>

      </section>

    </div>
  );
}