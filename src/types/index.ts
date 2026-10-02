export type PanelType = 'Panel 1' | 'Panel 2' | 'Panel 3' | 'Panel 4';

export type TimeSlotType =
  | '10:00 - 10:30 AM'
  | '10:45 - 11:15 AM'
  | '11:30 AM - 12:00 PM'
  | '12:15 - 12:45 PM'
  | '3:00 - 3:30 PM'
  | '3:45 - 4:15 PM'
  | '4:30 - 5:00 PM';

export type CandidateStatus = 'scheduled' | 'interviewing' | 'completed' | 'on-hold' | 'absent';

export interface Candidate {
  id: string;
  name: string;
  rollNo?: string;
  mobile: string;
  panel: PanelType;
  timeSlot: TimeSlotType;
  slotIndex?: number;
  domainPref1?: string;
  domainPref2?: string;
  status: CandidateStatus;
  notes?: string;
  score?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PanelConfig {
  id: PanelType;
  name: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeClass: string;
  interviewers: string[];
}

export type ViewMode = 'by-slot' | 'by-panel' | 'table';

export interface FilterState {
  searchQuery: string;
  selectedPanel: PanelType | 'ALL';
  selectedSlot: TimeSlotType | 'ALL';
  selectedStatus: CandidateStatus | 'ALL';
  viewMode: ViewMode;
}
