import { TimeSlotType, PanelType, CandidateStatus } from '../types';

export const TIME_SLOTS: { id: TimeSlotType; label: string; number: number; isOverflow?: boolean }[] = [
  { id: '10:30 - 11:00 AM', label: 'Slot 1 (10:30 - 11:00 AM)', number: 1 },
  { id: '11:15 - 11:45 AM', label: 'Slot 2 (11:15 - 11:45 AM)', number: 2 },
  { id: '12:00 - 12:30 PM', label: 'Slot 3 (12:00 - 12:30 PM)', number: 3 },
  { id: '12:45 - 1:15 PM', label: 'Slot 4 (12:45 - 1:15 PM)', number: 4 },
  { id: '3:00 - 3:30 PM', label: 'Slot 5 (3:00 - 3:30 PM - Post Lunch)', number: 5 },
  { id: '3:45 - 4:15 PM', label: 'Slot 6 (3:45 - 4:15 PM - Overflow)', number: 6, isOverflow: true },
  { id: '4:30 - 5:00 PM', label: 'Slot 7 (4:30 - 5:00 PM - Overflow)', number: 7, isOverflow: true }
];

export const OLD_SLOT_MAP: Record<string, TimeSlotType> = {
  '10:00 - 10:30 AM': '10:30 - 11:00 AM',
  '10:45 - 11:15 AM': '11:15 - 11:45 AM',
  '11:30 AM - 12:00 PM': '12:00 - 12:30 PM',
  '12:15 - 12:45 PM': '12:45 - 1:15 PM'
};

export const PANEL_LIST: PanelType[] = ['Panel 1', 'Panel 2', 'Panel 3', 'Panel 4'];

export const STATUS_CONFIG: Record<CandidateStatus, { label: string; color: string; bg: string; border: string }> = {
  scheduled: {
    label: 'Scheduled',
    color: '#9a8a78',
    bg: 'rgba(154, 138, 120, 0.15)',
    border: 'rgba(154, 138, 120, 0.3)'
  },
  interviewing: {
    label: 'Interviewing',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)'
  },
  completed: {
    label: 'Completed',
    color: '#1fae5f',
    bg: 'rgba(31, 174, 95, 0.15)',
    border: 'rgba(31, 174, 95, 0.4)'
  },
  'on-hold': {
    label: 'On Hold',
    color: '#ff9933',
    bg: 'rgba(255, 153, 51, 0.15)',
    border: 'rgba(255, 153, 51, 0.4)'
  },
  absent: {
    label: 'Absent',
    color: '#e2493a',
    bg: 'rgba(226, 73, 58, 0.15)',
    border: 'rgba(226, 73, 58, 0.4)'
  }
};

export const STORAGE_KEY = 'recruitment_interview_members_v3';
export const PANELS_STORAGE_KEY = 'recruitment_interview_panels_v1';

