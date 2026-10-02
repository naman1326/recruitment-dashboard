import React from 'react';
import { Users, Clock, Video, CheckCircle2, PauseCircle, UserX } from 'lucide-react';
import { Candidate, CandidateStatus } from '../types';

interface StatsStripProps {
  candidates: Candidate[];
  selectedStatus: CandidateStatus | 'ALL';
  onSelectStatus: (status: CandidateStatus | 'ALL') => void;
}

export const StatsStrip: React.FC<StatsStripProps> = ({
  candidates,
  selectedStatus,
  onSelectStatus
}) => {
  const total = candidates.length;
  const scheduled = candidates.filter(c => c.status === 'scheduled').length;
  const interviewing = candidates.filter(c => c.status === 'interviewing').length;
  const completed = candidates.filter(c => c.status === 'completed').length;
  const onHold = candidates.filter(c => c.status === 'on-hold').length;
  const absent = candidates.filter(c => c.status === 'absent').length;

  return (
    <div className="stat-strip">
      {/* Total Candidates */}
      <div 
        className={`stat-card stat-card-total ${selectedStatus === 'ALL' ? 'is-active-filter' : ''}`}
        onClick={() => onSelectStatus('ALL')}
        title="Filter all candidates"
      >
        <div className="stat-card-top">
          <span className="stat-label">Total Candidates</span>
          <div className="stat-icon">
            <Users size={18} color="var(--brand-red)" />
          </div>
        </div>
        <div className="stat-number">{total}</div>
      </div>

      {/* Scheduled */}
      <div 
        className={`stat-card stat-card-scheduled ${selectedStatus === 'scheduled' ? 'is-active-filter' : ''}`}
        onClick={() => onSelectStatus(selectedStatus === 'scheduled' ? 'ALL' : 'scheduled')}
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
        className={`stat-card stat-card-interviewing ${selectedStatus === 'interviewing' ? 'is-active-filter' : ''}`}
        onClick={() => onSelectStatus(selectedStatus === 'interviewing' ? 'ALL' : 'interviewing')}
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
        className={`stat-card stat-card-done ${selectedStatus === 'completed' ? 'is-active-filter' : ''}`}
        onClick={() => onSelectStatus(selectedStatus === 'completed' ? 'ALL' : 'completed')}
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

      {/* On Hold */}
      <div 
        className={`stat-card stat-card-hold ${selectedStatus === 'on-hold' ? 'is-active-filter' : ''}`}
        onClick={() => onSelectStatus(selectedStatus === 'on-hold' ? 'ALL' : 'on-hold')}
        title="Filter on-hold candidates"
      >
        <div className="stat-card-top">
          <span className="stat-label">On Hold</span>
          <div className="stat-icon">
            <PauseCircle size={18} color="var(--brand-saffron-alt)" />
          </div>
        </div>
        <div className="stat-number" style={{ color: 'var(--brand-saffron-alt)' }}>{onHold}</div>
      </div>

      {/* Absent */}
      <div 
        className={`stat-card stat-card-absent ${selectedStatus === 'absent' ? 'is-active-filter' : ''}`}
        onClick={() => onSelectStatus(selectedStatus === 'absent' ? 'ALL' : 'absent')}
        title="Filter absent candidates"
      >
        <div className="stat-card-top">
          <span className="stat-label">Absent</span>
          <div className="stat-icon">
            <UserX size={18} color="var(--duplicate)" />
          </div>
        </div>
        <div className="stat-number" style={{ color: 'var(--duplicate)' }}>{absent}</div>
      </div>
    </div>
  );
};
