import React from 'react';
import { Users, Clock, Video, CheckCircle2, PauseCircle, UserX, AlertCircle, FileClock } from 'lucide-react';
import { Candidate, CandidateStatus } from '../types';

interface StatsStripProps {
  candidates: Candidate[];
  selectedStatus: CandidateStatus | 'ALL';
  onSelectStatus: (status: CandidateStatus | 'ALL') => void;
  selectedCategory: string | 'ALL';
  onSelectCategory: (category: string | 'ALL') => void;
}

export const StatsStrip: React.FC<StatsStripProps> = ({
  candidates,
  selectedStatus,
  onSelectStatus,
  selectedCategory,
  onSelectCategory
}) => {
  const total = candidates.length;
  // Calculate unique candidates based on rollNo or lowercased name
  const uniqueCandidateKeys = new Set(
    candidates.map(c => (c.rollNo ? c.rollNo.toLowerCase().strip?.() || c.rollNo.toLowerCase() : c.name.toLowerCase().trim()))
  );
  const uniqueCount = uniqueCandidateKeys.size;
  const rescheduledCount = total - uniqueCount;

  const scheduled = candidates.filter(c => c.status === 'scheduled').length;
  const interviewing = candidates.filter(c => c.status === 'interviewing').length;
  const completed = candidates.filter(c => c.status === 'completed').length;
  const onHold = candidates.filter(c => c.status === 'on-hold').length;
  const absent = candidates.filter(c => c.status === 'absent').length;

  const lateFormsCount = candidates.filter(c => c.category === 'Filled Form Late').length;
  const missedFirstCount = candidates.filter(c => c.category === 'Missed First Interview').length;

  return (
    <div className="stat-strip">
      {/* Total Candidates */}
      <div 
        className={`stat-card stat-card-total ${selectedStatus === 'ALL' && selectedCategory === 'ALL' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectStatus('ALL');
          onSelectCategory('ALL');
        }}
        title="Show all candidate entries"
      >
        <div className="stat-card-top">
          <span className="stat-label">Total Scheduled</span>
          <div className="stat-icon">
            <Users size={18} color="var(--brand-red)" />
          </div>
        </div>
        <div className="stat-number-wrap">
          <span className="stat-number">{total}</span>
          <span className="stat-subtext" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
            {uniqueCount} Unique ({rescheduledCount} Re-scheduled)
          </span>
        </div>
      </div>

      {/* Scheduled */}
      <div 
        className={`stat-card stat-card-scheduled ${selectedStatus === 'scheduled' && selectedCategory === 'ALL' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectCategory('ALL');
          onSelectStatus(selectedStatus === 'scheduled' ? 'ALL' : 'scheduled');
        }}
        title="Filter scheduled candidates"
      >
        <div className="stat-card-top">
          <span className="stat-label">Scheduled</span>
          <div className="stat-icon">
            <Clock size={18} color="var(--text-muted)" />
          </div>
        </div>
        <div className="stat-number" style={{ color: 'var(--text-secondary)' }}>{scheduled}</div>
      </div>

      {/* Interviewing */}
      <div 
        className={`stat-card stat-card-interviewing ${selectedStatus === 'interviewing' && selectedCategory === 'ALL' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectCategory('ALL');
          onSelectStatus(selectedStatus === 'interviewing' ? 'ALL' : 'interviewing');
        }}
        title="Filter actively interviewing candidates"
      >
        <div className="stat-card-top">
          <span className="stat-label">Interviewing</span>
          <div className="stat-icon">
            <Video size={18} color="#38bdf8" />
          </div>
        </div>
        <div className="stat-number" style={{ color: '#38bdf8' }}>{interviewing}</div>
      </div>

      {/* Completed */}
      <div 
        className={`stat-card stat-card-done ${selectedStatus === 'completed' && selectedCategory === 'ALL' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectCategory('ALL');
          onSelectStatus(selectedStatus === 'completed' ? 'ALL' : 'completed');
        }}
        title="Filter completed/selected candidates"
      >
        <div className="stat-card-top">
          <span className="stat-label">Completed</span>
          <div className="stat-icon">
            <CheckCircle2 size={18} color="var(--confirm)" />
          </div>
        </div>
        <div className="stat-number" style={{ color: 'var(--confirm)' }}>{completed}</div>
      </div>

      {/* Absent */}
      <div 
        className={`stat-card stat-card-absent ${selectedStatus === 'absent' && selectedCategory === 'ALL' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectCategory('ALL');
          onSelectStatus(selectedStatus === 'absent' ? 'ALL' : 'absent');
        }}
        title="Filter candidates marked absent in 1st/2nd round"
      >
        <div className="stat-card-top">
          <span className="stat-label">Absent</span>
          <div className="stat-icon">
            <UserX size={18} color="var(--duplicate)" />
          </div>
        </div>
        <div className="stat-number" style={{ color: 'var(--duplicate)' }}>{absent}</div>
      </div>

      {/* Late Forms (Panel 5 category) */}
      <div 
        className={`stat-card stat-card-late ${selectedCategory === 'Filled Form Late' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectStatus('ALL');
          onSelectCategory(selectedCategory === 'Filled Form Late' ? 'ALL' : 'Filled Form Late');
        }}
        title="Filter candidates who filled form late (Panel 5)"
      >
        <div className="stat-card-top">
          <span className="stat-label">Late Forms</span>
          <div className="stat-icon">
            <FileClock size={18} color="#ff9933" />
          </div>
        </div>
        <div className="stat-number" style={{ color: '#ff9933' }}>{lateFormsCount}</div>
      </div>

      {/* Missed 1st Interview (Panel 5 category) */}
      <div 
        className={`stat-card stat-card-missed ${selectedCategory === 'Missed First Interview' ? 'is-active-filter' : ''}`}
        onClick={() => {
          onSelectStatus('ALL');
          onSelectCategory(selectedCategory === 'Missed First Interview' ? 'ALL' : 'Missed First Interview');
        }}
        title="Filter candidates who missed 1st interview & rescheduled to Panel 5"
      >
        <div className="stat-card-top">
          <span className="stat-label">Missed 1st Round</span>
          <div className="stat-icon">
            <AlertCircle size={18} color="#ec4899" />
          </div>
        </div>
        <div className="stat-number" style={{ color: '#ec4899' }}>{missedFirstCount}</div>
      </div>
    </div>
  );
};

