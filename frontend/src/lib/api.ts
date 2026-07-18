import {
  Meeting,
  MeetingDetail,
  Participant,
  TranscriptSegment,
  ActionItem,
  SearchResult,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  CreateActionItemPayload,
  UpdateActionItemPayload,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/* ===== Generic fetch helper with error handling ===== */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Try to extract error detail from the response body
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.detail) {
        errorMessage = typeof errorBody.detail === 'string'
          ? errorBody.detail
          : JSON.stringify(errorBody.detail);
      }
    } catch {
      // Body wasn't JSON — use default message
    }
    throw new Error(errorMessage);
  }

  // 204 No Content — return undefined (cast to T for void endpoints)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* ===== Meetings ===== */

export async function fetchMeetings(params?: {
  search?: string;
  participant?: number;
  sort?: string;
}): Promise<Meeting[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.participant) searchParams.set('participant', String(params.participant));
  if (params?.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  const endpoint = `/meetings${query ? `?${query}` : ''}`;
  return apiFetch<Meeting[]>(endpoint);
}

export async function fetchMeeting(id: number): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>(`/meetings/${id}`);
}

export async function createMeeting(data: CreateMeetingPayload): Promise<Meeting> {
  return apiFetch<Meeting>('/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMeeting(
  id: number,
  data: UpdateMeetingPayload
): Promise<Meeting> {
  return apiFetch<Meeting>(`/meetings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: number): Promise<void> {
  return apiFetch<void>(`/meetings/${id}`, {
    method: 'DELETE',
  });
}

/* ===== Transcript ===== */

export async function uploadTranscript(
  meetingId: number,
  text: string
): Promise<TranscriptSegment[]> {
  return apiFetch<TranscriptSegment[]>(`/meetings/${meetingId}/transcript`, {
    method: 'POST',
    body: JSON.stringify({
      transcript: text,
    }),
  });
}
/* ===== Participants ===== */

export async function fetchParticipants(): Promise<Participant[]> {
  return apiFetch<Participant[]>('/participants');
}

/* ===== Action Items ===== */

export async function createActionItem(
  meetingId: number,
  data: CreateActionItemPayload
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/meetings/${meetingId}/action-items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateActionItem(
  id: number,
  data: UpdateActionItemPayload
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/action-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteActionItem(id: number): Promise<void> {
  return apiFetch<void>(`/action-items/${id}`, {
    method: 'DELETE',
  });
}

/* ===== Search ===== */

export async function globalSearch(query: string): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
}
