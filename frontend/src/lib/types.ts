/* ===== TypeScript interfaces matching the FastAPI backend schemas ===== */

export interface Participant {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  duration_seconds: number;
  participants: Participant[];
  summary: Summary | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingDetail extends Meeting {
  transcript_segments: TranscriptSegment[];
  summary: Summary | null;
  topics: Topic[];
  action_items: ActionItem[];
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker: Participant;
  start_time_seconds: number;
  end_time_seconds: number;
  text: string;
  order_index: number;
}

export interface Topic {
  id: number;
  meeting_id: number;
  title: string;
  start_time_seconds: number;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview_text: string;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  assignee: Participant | null;
  is_completed: boolean;
  due_date: string | null;
}

export interface SearchResult {
  meeting_id: number;
  meeting_title: string;
  meeting_date: string;
  matches: {
    segment_text: string;
    speaker_name: string;
    timestamp: number;
  }[];
}

/* ===== Request/payload types for mutations ===== */

export interface CreateMeetingPayload {
  title: string;
  date: string;
  duration_seconds: number;
  participant_ids: number[];
}

export interface UpdateMeetingPayload {
  title?: string;
  date?: string;
  duration_seconds?: number;
  participant_ids?: number[];
}

export interface CreateActionItemPayload {
  text: string;
  assignee_id?: number | null;
  due_date?: string | null;
}

export interface UpdateActionItemPayload {
  text?: string;
  assignee_id?: number | null;
  is_completed?: boolean;
  due_date?: string | null;
}
