import React from 'react';
import { Phone, MessageSquare, Copy, Clock, Award, Tag } from 'lucide-react';
import { Candidate, CandidateStatus, PanelConfig, TimeSlotType } from '../types';
import { STATUS_CONFIG, TIME_SLOTS } from '../constants/panels';
import { useToast } from './Toast';

interface CandidateCardProps {
  candidate: Candidate;
  panelConfig: PanelConfig;
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateStatus: (id: string, status: CandidateStatus) => void;
  onMoveSlot: (id: string, slot: TimeSlotType) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  panelConfig,
  onSelectCandidate,
  onUpdateStatus,
  onMoveSlot
}) => {
  const { showToast } = useToast();

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!candidate.mobile) {
      showToast('No phone number available', 'error');
      return;
    }
    navigator.clipboard.writeText(candidate.mobile);
    showToast(`Copied ${candidate.name}'s phone: +91 ${candidate.mobile}`);
  };

  const cleanPhone = candidate.mobile.replace(/\D/g, '');
  const waUrl = cleanPhone 
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${candidate.name}, this is from the Swarajya recruitment team. Your interview with ${candidate.panel} is scheduled for ${candidate.timeSlot}. Please report on time.`)}` 
    : '#';

  const panelTagClass = `panel-tag panel-${candidate.panel.replace('Panel ', '')}`;

  return (
    <div 
      className="candidate-card"
      onClick={() => onSelectCandidate(candidate)}
      style={{ cursor: 'pointer' }}
    >
      {/* Top Details */}
      <div className="candidate-card-top">
        <div className="candidate-info-block">
          <div 
            className="candidate-avatar"
            style={{ 
              backgroundColor: panelConfig.bgLight, 
              color: panelConfig.color,
              borderColor: panelConfig.borderColor
            }}
          >
            {getInitials(candidate.name)}
          </div>
          <div className="candidate-name-wrap">
            <span className="candidate-name">{candidate.name}</span>
            <div className="candidate-meta-line">
              {candidate.rollNo && (
                <span className="roll-badge">{candidate.rollNo}</span>
              )}
              <span className={panelTagClass}>{candidate.panel}</span>
            </div>
          </div>
        </div>

        {/* Score or Status Pill */}
        {candidate.score ? (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2px', 
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--brand-saffron)'
            }}
            title="Candidate score"
          >
            <Award size={14} />
            <span>{candidate.score}/10</span>
          </div>
        ) : null}
      </div>

      {/* Domain Preferences */}
      <div className="domain-tags-wrap">
        {candidate.domainPref1 && (
          <span className="domain-tag primary">
            <Tag size={11} />
            <span>{candidate.domainPref1}</span>
          </span>
        )}
        {candidate.domainPref2 && (
          <span className="domain-tag">
            <span>{candidate.domainPref2}</span>
          </span>
        )}
      </div>

      {/* Time Slot Info & Quick Slot Reassignment */}
      <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={13} color="var(--brand-saffron)" />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Slot:</span>
        </div>
        <select
          value={candidate.timeSlot}
          onChange={(e) => onMoveSlot(candidate.id, e.target.value as TimeSlotType)}
          title="Move candidate to different time slot"
          style={{
            padding: '2px 6px',
            fontSize: '0.72rem',
            borderRadius: '6px',
            background: 'var(--input-bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            maxWidth: '170px'
          }}
        >
          {TIME_SLOTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons & Status Selector */}
      <div className="card-actions-bar" onClick={(e) => e.stopPropagation()}>
        {/* Quick Contact buttons */}
        <div className="quick-contact-group">
          {candidate.mobile ? (
            <>
              <a 
                href={`tel:+91${cleanPhone}`}
                className="contact-btn btn-call"
                title={`Call +91 ${candidate.mobile}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={14} />
              </a>
              <a 
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-btn btn-whatsapp"
                title="Send WhatsApp message"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageSquare size={14} />
              </a>
              <button 
                type="button" 
                className="contact-btn btn-copy"
                title="Copy phone number"
                onClick={handleCopyPhone}
              >
                <Copy size={14} />
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No phone</span>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="status-select-wrap">
          <select 
            className="status-dropdown"
            value={candidate.status}
            onChange={(e) => onUpdateStatus(candidate.id, e.target.value as CandidateStatus)}
            style={{
              backgroundColor: STATUS_CONFIG[candidate.status].bg,
              color: STATUS_CONFIG[candidate.status].color,
              borderColor: STATUS_CONFIG[candidate.status].border
            }}
          >
            <option value="scheduled" style={{ background: '#1e1916', color: '#f5e6d3' }}>Scheduled</option>
            <option value="interviewing" style={{ background: '#1e1916', color: '#38bdf8' }}>Interviewing</option>
            <option value="completed" style={{ background: '#1e1916', color: '#1fae5f' }}>Completed</option>
            <option value="on-hold" style={{ background: '#1e1916', color: '#ff9933' }}>On Hold</option>
            <option value="absent" style={{ background: '#1e1916', color: '#e2493a' }}>Absent</option>
          </select>
        </div>
      </div>
    </div>
  );
};
