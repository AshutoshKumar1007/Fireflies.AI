'use client';

import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { fetchParticipants } from '@/lib/api';
import { Participant } from '@/lib/types';

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
  const [participantId, setParticipantId] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    fetchParticipants()
      .then(setParticipants)
      .catch(() => {
        // Filter dropdown just stays empty; search/sort still work.
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, onSearchChange]);

  const handleParticipantChange = (value: string) => {
    setParticipantId(value);
    onParticipantFilter(value ? Number(value) : undefined);
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meetings by title..."
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

      <div className="relative w-full lg:w-56">
        <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <select
          value={participantId}
          onChange={(e) => handleParticipantChange(e.target.value)}
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
          <option value="">All participants</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
