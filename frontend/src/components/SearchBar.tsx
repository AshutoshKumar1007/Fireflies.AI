
// components/SearchBar.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface Props {
  onSearchChange: (value: string) => void;
  onParticipantFilter: (participantId?: number) => void;
  onSortChange: (value: string) => void;
  currentSort: string;
}

export default function SearchBar({
  onSearchChange,
  onParticipantFilter,
  onSortChange,
  currentSort,
}: Props) {
  const [search, setSearch] = useState('');
  const [participant, setParticipant] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, onSearchChange]);

  useEffect(() => {
    if (!participant.trim()) {
      onParticipantFilter(undefined);
      return;
    }

    const value = Number(participant);

    if (!Number.isNaN(value)) {
      onParticipantFilter(value);
    }
  }, [participant, onParticipantFilter]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meetings, summaries or transcript..."
          className="
            h-11
            w-full
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-fireflies-primary
          "
        />
      </div>

      <div className="relative w-full lg:w-48">
        <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
          placeholder="Filter by participant ID"
          className="
            h-11
            w-full
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-fireflies-primary
          "
        />
      </div>

      <div className="relative w-full lg:w-52">
        <ArrowsUpDownIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="
            h-11
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-fireflies-primary
          "
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
        </select>
      </div>
    </div>
  );
}
