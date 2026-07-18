'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Participant, Meeting } from '@/lib/types';
import { fetchParticipants, createMeeting, updateMeeting, uploadTranscript } from '@/lib/api';
import { useToast } from './Toast';

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** If provided, the modal is in edit mode */
  editMeeting?: Meeting;
}

export default function MeetingFormModal({
  isOpen,
  onClose,
  onSuccess,
  editMeeting,
}: MeetingFormModalProps) {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isEditMode = Boolean(editMeeting);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [transcriptText, setTranscriptText] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load participants
  useEffect(() => {
    if (isOpen) {
      fetchParticipants()
        .then(setParticipants)
        .catch(() => {
          // Fail silently, user can still create without participants
        });
    }
  }, [isOpen]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (editMeeting) {
      setTitle(editMeeting.title);
      // Format the date for datetime-local input
      const d = new Date(editMeeting.date);
      const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localISO);
      setDurationMinutes(Math.round(editMeeting.duration_seconds / 60));
      setSelectedParticipantIds(editMeeting.participants.map((p) => p.id));
    } else {
      // Reset form for create mode
      setTitle('');
      setDate('');
      setDurationMinutes(30);
      setSelectedParticipantIds([]);
      setTranscriptText('');
    }
    setErrors({});
  }, [editMeeting, isOpen]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Toggle participant checkbox
  const toggleParticipant = (id: number) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // File upload handler for .txt transcript
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTranscriptText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!date) newErrors.date = 'Date is required';
    if (durationMinutes <= 0) newErrors.duration = 'Duration must be positive';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editMeeting) {
        await updateMeeting(editMeeting.id, {
          title: title.trim(),
          date: new Date(date).toISOString(),
          duration_seconds: durationMinutes * 60,
          participant_ids: selectedParticipantIds,
        });
        showToast('success', 'Meeting updated successfully');
      } else {
        const newMeeting = await createMeeting({
        title: title.trim(),
        date: new Date(date).toISOString(),
        duration_seconds: durationMinutes * 60,
        participant_ids: selectedParticipantIds,
      });

      if (transcriptText.trim()) {
        try {
          await uploadTranscript(newMeeting.id, transcriptText.trim());
        } catch {
          showToast(
            'info',
            'Meeting created successfully, but transcript upload failed.'
          );
        }
      }

      showToast('success', 'Meeting created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fireflies-border">
          <h2 className="font-heading font-semibold text-lg text-fireflies-text-primary">
            {isEditMode ? 'Edit Meeting' : 'New Meeting'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-fireflies-text-muted hover:text-fireflies-text-primary hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-fireflies-text-primary mb-1.5">
              Title <span className="text-fireflies-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Team Standup"
              className={`
                w-full px-3.5 py-2.5 rounded-xl border text-sm
                focus:outline-none focus:ring-2 focus:ring-fireflies-primary/30 focus:border-fireflies-primary
                transition-all duration-200
                ${errors.title ? 'border-fireflies-danger' : 'border-fireflies-border'}
              `}
            />
            {errors.title && (
              <p className="text-xs text-fireflies-danger mt-1">{errors.title}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-fireflies-text-primary mb-1.5">
              Date & Time <span className="text-fireflies-danger">*</span>
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`
                w-full px-3.5 py-2.5 rounded-xl border text-sm
                focus:outline-none focus:ring-2 focus:ring-fireflies-primary/30 focus:border-fireflies-primary
                transition-all duration-200
                ${errors.date ? 'border-fireflies-danger' : 'border-fireflies-border'}
              `}
            />
            {errors.date && (
              <p className="text-xs text-fireflies-danger mt-1">{errors.date}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-fireflies-text-primary mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className={`
                w-full px-3.5 py-2.5 rounded-xl border text-sm
                focus:outline-none focus:ring-2 focus:ring-fireflies-primary/30 focus:border-fireflies-primary
                transition-all duration-200
                ${errors.duration ? 'border-fireflies-danger' : 'border-fireflies-border'}
              `}
            />
            {errors.duration && (
              <p className="text-xs text-fireflies-danger mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-fireflies-text-primary mb-1.5">
                Participants
              </label>
              <div className="max-h-36 overflow-y-auto border border-fireflies-border rounded-xl p-3 space-y-2">
                {participants.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipantIds.includes(p.id)}
                      onChange={() => toggleParticipant(p.id)}
                      className="w-4 h-4 rounded border-gray-300 text-fireflies-primary focus:ring-fireflies-primary/30"
                    />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: p.avatar_color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-fireflies-text-primary">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Transcript (create mode only) */}
          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-fireflies-text-primary mb-1.5">
                Transcript (optional)
              </label>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste your transcript text here..."
                rows={5}
                className="
                  w-full px-3.5 py-2.5 rounded-xl border border-fireflies-border text-sm
                  focus:outline-none focus:ring-2 focus:ring-fireflies-primary/30 focus:border-fireflies-primary
                  transition-all duration-200 resize-none
                "
              />
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-fireflies-border rounded-lg text-sm text-fireflies-text-secondary hover:bg-gray-50 cursor-pointer transition-colors">
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Upload .txt file
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-fireflies-text-secondary hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                px-5 py-2.5 rounded-xl text-sm font-medium text-white
                bg-fireflies-primary hover:bg-fireflies-primary-hover
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center gap-2
              "
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isEditMode ? 'Save Changes' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
