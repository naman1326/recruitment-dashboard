import { useState, useEffect, useRef, useCallback } from 'react';
import { Candidate } from '../types';
import { INITIAL_CANDIDATES } from '../constants/initialData';
import { OLD_SLOT_MAP } from '../constants/panels';
import { 
  getCurrentRoomId, 
  setCurrentRoomId, 
  fetchRemoteSchedule, 
  pushRemoteSchedule, 
  publishLiveCandidateUpdate,
  subscribeLiveCandidateUpdates,
  DEFAULT_ROOM_ID,
  LAST_SYNC_KEY
} from '../utils/cloudSync';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'idle';

interface UseCloudSyncOptions {
  candidates: Candidate[];
  onApplyRemoteCandidates: (updatedCandidates: Candidate[]) => void;
  onCandidateChangedRemotely?: (candidate: Candidate, oldCandidate?: Candidate) => void;
}

export function useCloudSync({
  candidates,
  onApplyRemoteCandidates,
  onCandidateChangedRemotely
}: UseCloudSyncOptions) {
  const [roomId, setRoomIdState] = useState<string>(getCurrentRoomId());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem(LAST_SYNC_KEY) || '';
  });
  const [flashingCandidateId, setFlashingCandidateId] = useState<string | null>(null);

  // Unique client identifier to prevent processing self-echoed events
  const clientIdRef = useRef<string>(
    'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36)
  );

  const candidatesRef = useRef(candidates);
  candidatesRef.current = candidates;

  const isSyncingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Update room ID
  const changeRoomId = (newRoom: string) => {
    const clean = newRoom.trim() || DEFAULT_ROOM_ID;
    setCurrentRoomId(clean);
    setRoomIdState(clean);
    hasInitializedRef.current = false;
  };

  // Perform full pull and merge from persistent cloud storage (MantleDB)
  const syncWithCloud = useCallback(async (isInitial = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const rawRemote = await fetchRemoteSchedule(roomId);
      const initMap = new Map(INITIAL_CANDIDATES.map(c => [c.id, c]));

      if (!rawRemote || rawRemote.length === 0) {
        // If room is empty on cloud, seed with current local candidates
        if (isInitial || !hasInitializedRef.current) {
          await pushRemoteSchedule(candidatesRef.current, roomId);
          hasInitializedRef.current = true;
        }
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
        isSyncingRef.current = false;
        return;
      }

      hasInitializedRef.current = true;

      // Hydrate remote candidates with questionnaire fields from INITIAL_CANDIDATES
      const remote = rawRemote.map(rem => {
        const init = initMap.get(rem.id) || INITIAL_CANDIDATES.find(i => 
          (rem.rollNo && i.rollNo && i.rollNo.toLowerCase() === rem.rollNo.toLowerCase()) || 
          i.name.toLowerCase() === rem.name.toLowerCase()
        );
        const rawSlot = rem.timeSlot || init?.timeSlot || '10:30 - 11:00 AM';
        const timeSlot = OLD_SLOT_MAP[rawSlot] || rawSlot;
        return {
          ...init,
          ...rem,
          timeSlot,
          fitReason: rem.fitReason || init?.fitReason || '',
          clubMotivation: rem.clubMotivation || init?.clubMotivation || '',
        };
      });

      // Detect differences and merge
      const localMap = new Map(candidatesRef.current.map(c => [c.id, c]));
      let hasChanges = false;
      const merged: Candidate[] = [];
      let lastChangedCandidate: Candidate | null = null;
      let lastOldCandidate: Candidate | undefined = undefined;

      for (const rem of remote) {
        const loc = localMap.get(rem.id);

        if (!loc) {
          // New candidate from cloud
          merged.push(rem);
          hasChanges = true;
          continue;
        }

        const remTime = rem.updatedAt ? new Date(rem.updatedAt).getTime() : 0;
        const locTime = loc.updatedAt ? new Date(loc.updatedAt).getTime() : 0;

        const isStatusDifferent = rem.status !== loc.status;
        const isScoreDifferent = rem.score !== loc.score;
        const isNotesDifferent = (rem.notes || '') !== (loc.notes || '');
        const isSlotDifferent = rem.timeSlot !== loc.timeSlot;
        const isDeptDifferent = (rem.preferredDept || '') !== (loc.preferredDept || '');

        const init = initMap.get(rem.id) || INITIAL_CANDIDATES.find(i => 
          (rem.rollNo && i.rollNo && i.rollNo.toLowerCase() === rem.rollNo.toLowerCase()) || 
          i.name.toLowerCase() === rem.name.toLowerCase()
        );

        if (isStatusDifferent || isScoreDifferent || isNotesDifferent || isSlotDifferent || isDeptDifferent) {
          const remEvaluated = rem.status !== 'scheduled' || rem.score !== undefined || (rem.notes && rem.notes.trim()) || rem.preferredDept;
          const locEvaluated = loc.status !== 'scheduled' || loc.score !== undefined || (loc.notes && loc.notes.trim()) || loc.preferredDept;

          let chooseRemote = false;
          if (remEvaluated && !locEvaluated) {
            chooseRemote = true;
          } else if (!remEvaluated && locEvaluated) {
            chooseRemote = false;
          } else {
            chooseRemote = remTime >= locTime;
          }

          if (chooseRemote) {
            const chosen: Candidate = {
              ...init,
              ...rem,
              preferredDept: rem.preferredDept || loc.preferredDept,
              fitReason: rem.fitReason || loc.fitReason || init?.fitReason || '',
              clubMotivation: rem.clubMotivation || loc.clubMotivation || init?.clubMotivation || '',
            };
            merged.push(chosen);
            hasChanges = true;
            lastChangedCandidate = chosen;
            lastOldCandidate = loc;
          } else {
            const chosen: Candidate = {
              ...init,
              ...loc,
              preferredDept: loc.preferredDept || rem.preferredDept,
              fitReason: loc.fitReason || rem.fitReason || init?.fitReason || '',
              clubMotivation: loc.clubMotivation || rem.clubMotivation || init?.clubMotivation || '',
            };
            merged.push(chosen);
          }
        } else {
          // Keep current state but ensure questionnaire answers and department are populated
          const chosen: Candidate = {
            ...init,
            ...loc,
            preferredDept: loc.preferredDept || rem.preferredDept,
            fitReason: loc.fitReason || rem.fitReason || init?.fitReason || '',
            clubMotivation: loc.clubMotivation || rem.clubMotivation || init?.clubMotivation || '',
          };
          if (!loc.fitReason && chosen.fitReason) {
            hasChanges = true;
          }
          merged.push(chosen);
        }
      }

      if (hasChanges) {
        onApplyRemoteCandidates(merged);
        if (lastChangedCandidate) {
          setFlashingCandidateId(lastChangedCandidate.id);
          setTimeout(() => setFlashingCandidateId(null), 2500);

          if (onCandidateChangedRemotely) {
            onCandidateChangedRemotely(lastChangedCandidate, lastOldCandidate);
          }
        }
      }

      setSyncStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('[CloudSync] Sync error:', err);
      setSyncStatus('offline');
    } finally {
      isSyncingRef.current = false;
    }
  }, [roomId, onApplyRemoteCandidates, onCandidateChangedRemotely]);

  // Initial full sync on mount
  useEffect(() => {
    syncWithCloud(true);
  }, [syncWithCloud]);

  // Real-Time Server-Sent Events (SSE) PubSub listener
  // Gives sub-second live synchronization across phones, laptops, and tablets
  useEffect(() => {
    const unsubscribe = subscribeLiveCandidateUpdates(roomId, (remoteCandidate, senderId) => {
      // Discard our own broadcasted messages
      if (senderId && senderId === clientIdRef.current) {
        return;
      }

      const currentList = candidatesRef.current;
      const localCandidate = currentList.find(c => c.id === remoteCandidate.id);

      if (!localCandidate) return;

      const isStatusDiff = localCandidate.status !== remoteCandidate.status;
      const isScoreDiff = localCandidate.score !== remoteCandidate.score;
      const isNotesDiff = (localCandidate.notes || '') !== (remoteCandidate.notes || '');
      const isSlotDiff = localCandidate.timeSlot !== remoteCandidate.timeSlot;
      const isDeptDiff = (localCandidate.preferredDept || '') !== (remoteCandidate.preferredDept || '');

      if (isStatusDiff || isScoreDiff || isNotesDiff || isSlotDiff || isDeptDiff) {
        const mergedCandidate: Candidate = {
          ...localCandidate,
          ...remoteCandidate,
          timeSlot: OLD_SLOT_MAP[remoteCandidate.timeSlot] || remoteCandidate.timeSlot || localCandidate.timeSlot,
          fitReason: localCandidate.fitReason || remoteCandidate.fitReason,
          clubMotivation: localCandidate.clubMotivation || remoteCandidate.clubMotivation,
          preferredDept: remoteCandidate.preferredDept !== undefined ? remoteCandidate.preferredDept : localCandidate.preferredDept,
          score: remoteCandidate.score !== undefined ? remoteCandidate.score : localCandidate.score,
          notes: remoteCandidate.notes !== undefined ? remoteCandidate.notes : localCandidate.notes,
          status: remoteCandidate.status || localCandidate.status,
          updatedAt: remoteCandidate.updatedAt || new Date().toISOString()
        };

        const updatedList = currentList.map(c => c.id === mergedCandidate.id ? mergedCandidate : c);
        onApplyRemoteCandidates(updatedList);

        // Visual flash indication
        setFlashingCandidateId(mergedCandidate.id);
        setTimeout(() => setFlashingCandidateId(null), 2500);

        // Toast feedback
        if (onCandidateChangedRemotely) {
          onCandidateChangedRemotely(mergedCandidate, localCandidate);
        }

        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, onApplyRemoteCandidates, onCandidateChangedRemotely]);

  // Low-frequency fallback polling (every 45s instead of 3.5s to preserve quota)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        syncWithCloud(false);
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [syncWithCloud]);

  // Instant sync on focus / tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        syncWithCloud(false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [syncWithCloud]);

  // Push single candidate update
  const pushUpdate = useCallback(async (updatedCandidate: Candidate) => {
    const candidateWithTime: Candidate = {
      ...updatedCandidate,
      updatedAt: new Date().toISOString()
    };

    const nextList = candidatesRef.current.map(c => 
      c.id === updatedCandidate.id ? candidateWithTime : c
    );

    // 1. Instantly broadcast to all connected devices via SSE (< 200ms)
    publishLiveCandidateUpdate(candidateWithTime, clientIdRef.current, roomId);

    // 2. Persist to cloud storage
    setSyncStatus('syncing');
    const success = await pushRemoteSchedule(nextList, roomId);
    setSyncStatus(success ? 'connected' : 'offline');
    if (success) {
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [roomId]);

  // Manual push for full list (e.g. import or reset)
  const pushFullSchedule = useCallback(async (fullList: Candidate[]) => {
    setSyncStatus('syncing');
    const success = await pushRemoteSchedule(fullList, roomId);
    setSyncStatus(success ? 'connected' : 'offline');
    if (success) {
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [roomId]);

  return {
    roomId,
    setRoomId: changeRoomId,
    syncStatus,
    lastSyncTime,
    flashingCandidateId,
    forceSyncNow: () => syncWithCloud(false),
    pushUpdate,
    pushFullSchedule
  };
}
