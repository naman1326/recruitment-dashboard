export type PanelType = 'Panel 1' | 'Panel 2' | 'Panel 3' | 'Panel 4' | 'Panel 5';

export type TimeSlotType =
  | '10:30 - 11:00 AM'
  | '11:15 - 11:45 AM'
  | '12:00 - 12:30 PM'
  | '12:45 - 1:15 PM'
  | '3:00 - 3:30 PM'
  | '3:45 - 4:15 PM'
  | '4:30 - 5:00 PM'
  | '9:30 - 10:00 PM'
  | '10:00 - 10:30 PM'
  | '10:30 - 11:00 PM'
  | '11:00 - 11:30 PM'
  | '11:30 PM - 12:00 AM'
  | '12:00 - 12:30 AM';

export type CandidateStatus = 'scheduled' | 'interviewing' | 'completed' | 'on-hold' | 'absent';

export type CandidateCategory = 'Filled Form Late' | 'Missed First Interview';

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
  preferredDept?: string;
  fitReason?: string;
  clubMotivation?: string;
  status: CandidateStatus;
  category?: CandidateCategory | string;
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
  selectedCategory: string | 'ALL';
  viewMode: ViewMode;
}

