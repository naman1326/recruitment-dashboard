import { Candidate } from '../types';

export const DEFAULT_ROOM_ID = 'swarajya-recruitment-2026';
export const ROOM_STORAGE_KEY = 'recruitment_cloud_room_id';
export const LAST_SYNC_KEY = 'recruitment_cloud_last_sync';

const CLOUD_BASE = 'https://mantledb.sh/v2';

export interface CloudPayload {
  room: string;
  version: number;
  updatedAt: string;
  candidates: Candidate[];
}

export function getCurrentRoomId(): string {
  try {
    const saved = localStorage.getItem(ROOM_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    // ignore
  }
  return DEFAULT_ROOM_ID;
}

export function setCurrentRoomId(roomId: string): void {
  try {
    localStorage.setItem(ROOM_STORAGE_KEY, roomId.trim() || DEFAULT_ROOM_ID);
  } catch (e) {
    // ignore
  }
}

/**
 * Fetch candidates state from shared cloud room
 */
export async function fetchRemoteSchedule(roomId: string = getCurrentRoomId()): Promise<Candidate[] | null> {
  const cleanRoom = encodeURIComponent(roomId || DEFAULT_ROOM_ID);
  try {
    const res = await fetch(`${CLOUD_BASE}/${cleanRoom}/schedule`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 404) {
      // Room not created yet in cloud
      return null;
    }

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.candidates) && data.candidates.length > 0) {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        return data.candidates;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Failed to fetch remote schedule:', err);
  }
  return null;
}

/**
 * Push full candidate schedule to shared cloud room
 */
export async function pushRemoteSchedule(candidates: Candidate[], roomId: string = getCurrentRoomId()): Promise<boolean> {
  const cleanRoom = encodeURIComponent(roomId || DEFAULT_ROOM_ID);

  // To prevent HTTP 413 Payload Too Large (MantleDB free limit is 64KB),
  // omit the large fitReason and clubMotivation questionnaire fields.
  // The client automatically re-hydrates them from INITIAL_CANDIDATES on fetch!
  const syncCandidates = candidates.map(c => {
    const { fitReason, clubMotivation, ...rest } = c;
    return rest;
  });

  const payload: CloudPayload = {
    room: roomId,
    version: 2,
    updatedAt: new Date().toISOString(),
    candidates: syncCandidates as Candidate[]
  };

  try {
    const res = await fetch(`${CLOUD_BASE}/${cleanRoom}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      localStorage.setItem(LAST_SYNC_KEY, payload.updatedAt);
      return true;
    }
  } catch (err) {
    console.warn('[CloudSync] Failed to push remote schedule:', err);
  }
  return false;
}

/**
 * Push update for a single candidate or merge with latest cloud state
 */
export async function pushCandidateUpdate(updatedCandidate: Candidate, currentAll: Candidate[], roomId: string = getCurrentRoomId()): Promise<Candidate[]> {
  // Update candidate in local array with timestamp
  const timestamp = new Date().toISOString();
  const candidateWithTime: Candidate = {
    ...updatedCandidate,
    updatedAt: timestamp
  };

  const updatedList = currentAll.map(c => c.id === updatedCandidate.id ? candidateWithTime : c);

  // Asynchronously broadcast to cloud
  pushRemoteSchedule(updatedList, roomId);

  return updatedList;
}
