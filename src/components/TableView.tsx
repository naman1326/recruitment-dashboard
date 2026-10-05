import React, { useMemo } from 'react';
import { Phone, MessageSquare, Copy, Edit3, Tag, Check, Plus } from 'lucide-react';
import { Candidate, CandidateStatus, PanelConfig, PanelType } from '../types';
import { STATUS_CONFIG } from '../constants/panels';
import { INITIAL_CANDIDATES } from '../constants/initialData';
import { useToast } from './Toast';

interface TableViewProps {
  candidates: Candidate[];
  panelConfigs: Record<PanelType, PanelConfig>;
  onSelectCandidate: (c: Candidate) => void;
  onUpdateStatus: (id: string, s: CandidateStatus) => void;
  onUpdatePreferredDept?: (id: string, dept?: string) => void;
  flashingCandidateId?: string | null;
}

export const TableView: React.FC<TableViewProps> = ({
  candidates,
  panelConfigs,
  onSelectCandidate,
  onUpdateStatus,
  onUpdatePreferredDept,
  flashingCandidateId
}) => {
  const { showToast } = useToast();
  const initMap = useMemo(() => new Map(INITIAL_CANDIDATES.map(i => [i.id, i])), []);

  const handleCopyPhone = (e: React.MouseEvent, mobile: string, name: string) => {
    e.stopPropagation();
    if (!mobile) return;
    navigator.clipboard.writeText(mobile);
    showToast(`Copied ${name}'s phone: +91 ${mobile}`);
  };

  if (candidates.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No Candidates Found</div>
        <p>Try adjusting your search query or filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mobile-table-hint">
        ← Swipe horizontally to view full table columns →
      </div>
      <div className="grid-scroll">
      <table className="participant-table">
        <thead>
          <tr>
            <th style={{ width: '45px' }}>#</th>
            <th>Candidate Name</th>
            <th>Roll / Reg No</th>
            <th>Panel</th>
            <th>Category</th>
            <th>Time Slot</th>
            <th>Status</th>
            <th>Domain Preferences</th>
            <th style={{ minWidth: '220px' }}>Why Good Fit & Skills</th>
            <th style={{ minWidth: '220px' }}>Why Swarajya</th>
            <th>Contact</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, idx) => {
            const config = panelConfigs[c.panel];
            const cleanPhone = c.mobile.replace(/\D/g, '');
            const waUrl = cleanPhone 
              ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${c.name}, this is from Swarajya recruitment team. Your interview with ${c.panel} is scheduled for ${c.timeSlot}. Please report on time.`)}`
              : '#';

            const init = initMap.get(c.id) || INITIAL_CANDIDATES.find(i => 
              (c.rollNo && i.rollNo && i.rollNo.toLowerCase() === c.rollNo.toLowerCase()) || 
              i.name.toLowerCase() === c.name.toLowerCase()
            );
            const fitReason = c.fitReason || init?.fitReason || '';
            const clubMotivation = c.clubMotivation || init?.clubMotivation || '';

            return (
              <tr 
                key={c.id}
                className={flashingCandidateId === c.id ? 'is-flashing' : ''}
                onClick={() => onSelectCandidate(c)}
              >
                {/* Index */}
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {idx + 1}
                </td>

                {/* Candidate Name */}
                <td className="col-name">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div 
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: config.bgLight,
                        color: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {c.name.slice(0, 1)}
                    </div>
                    <span>{c.name}</span>
                  </div>
                </td>

                {/* Roll No */}
                <td className="col-reg">
                  {c.rollNo ? (
                    <span className="roll-badge">{c.rollNo}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>

                {/* Panel */}
                <td>
                  <span 
                    className={`panel-tag panel-${(c.panel || 'Panel 1').replace('Panel ', '')}`}
                    style={{ color: config?.color || 'var(--brand-saffron)', border: `1px solid ${config?.borderColor || 'var(--border-medium)'}` }}
                  >
                    {c.panel}
                  </span>
                </td>

                {/* Category */}
                <td>
                  {(c.category || init?.category) ? (
                    <span 
                      className={`badge-category ${(c.category || init?.category) === 'Filled Form Late' ? 'badge-category-late' : 'badge-category-missed'}`}
                    >
                      {(c.category || init?.category) === 'Filled Form Late' ? 'Late Form' : 'Missed 1st Interview'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Standard</span>
                  )}
                </td>

                {/* Slot */}
                <td>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {c.timeSlot}
                  </span>
                </td>

                {/* Status Dropdown */}
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className="status-dropdown"
                    value={c.status}
                    onChange={(e) => onUpdateStatus(c.id, e.target.value as CandidateStatus)}
                    style={{
                      backgroundColor: STATUS_CONFIG[c.status].bg,
                      color: STATUS_CONFIG[c.status].color,
                      borderColor: STATUS_CONFIG[c.status].border
                    }}
                  >
                    <option value="scheduled" style={{ background: '#1e1916', color: '#f5e6d3' }}>Scheduled</option>
                    <option value="interviewing" style={{ background: '#1e1916', color: '#38bdf8' }}>Interviewing</option>
                    <option value="completed" style={{ background: '#1e1916', color: '#1fae5f' }}>Completed</option>
                    <option value="on-hold" style={{ background: '#1e1916', color: '#ff9933' }}>On Hold</option>
                    <option value="absent" style={{ background: '#1e1916', color: '#e2493a' }}>Absent</option>
                  </select>
                </td>

                {/* Domain Prefs & Selection */}
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {c.domainPref1 && (
                      <button
                        type="button"
                        className={`domain-btn ${c.preferredDept === c.domainPref1 ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = c.preferredDept === c.domainPref1 ? undefined : c.domainPref1;
                          onUpdatePreferredDept?.(c.id, next);
                        }}
                        title={c.preferredDept === c.domainPref1 ? 'Selected (click to unselect)' : `Choose ${c.domainPref1}`}
                      >
                        {c.preferredDept === c.domainPref1 ? <Check size={10} /> : <Tag size={9} />}
                        <span>{c.domainPref1}</span>
                      </button>
                    )}
                    {c.domainPref2 && (
                      <button
                        type="button"
                        className={`domain-btn ${c.preferredDept === c.domainPref2 ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = c.preferredDept === c.domainPref2 ? undefined : c.domainPref2;
                          onUpdatePreferredDept?.(c.id, next);
                        }}
                        title={c.preferredDept === c.domainPref2 ? 'Selected (click to unselect)' : `Choose ${c.domainPref2}`}
                      >
                        {c.preferredDept === c.domainPref2 ? <Check size={10} /> : null}
                        <span>{c.domainPref2}</span>
                      </button>
                    )}
                    {(() => {
                      const isOther = Boolean(
                        c.preferredDept &&
                        c.preferredDept !== c.domainPref1 &&
                        c.preferredDept !== c.domainPref2
                      );
                      return (
                        <button
                          type="button"
                          className={`domain-btn other-btn ${isOther ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentVal = isOther ? c.preferredDept : '';
                            const promptVal = window.prompt(`Enter preferred department for ${c.name}${isOther ? ' (leave empty to unselect)' : ''}:`, currentVal || '');
                            if (promptVal !== null) {
                              const trimmed = promptVal.trim();
                              onUpdatePreferredDept?.(c.id, trimmed ? trimmed : undefined);
                            }
                          }}
                          title={isOther ? `Custom: ${c.preferredDept}` : 'Enter other department manually'}
                        >
                          {isOther ? <Check size={10} /> : <Plus size={9} />}
                          <span>{isOther ? c.preferredDept : 'Other'}</span>
                        </button>
                      );
                    })()}
                  </div>
                </td>

                {/* Why Good Fit */}
                <td style={{ maxWidth: '240px' }} title={fitReason || ''}>
                  <div style={{ 
                    fontSize: '0.78rem', 
                    color: 'var(--text-secondary)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.35
                  }}>
                    {fitReason || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                </td>

                {/* Why Swarajya */}
                <td style={{ maxWidth: '240px' }} title={clubMotivation || ''}>
                  <div style={{ 
                    fontSize: '0.78rem', 
                    color: 'var(--text-secondary)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.35
                  }}>
                    {clubMotivation || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                </td>

                {/* Phone */}
                <td>
                  {c.mobile ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      +91 {c.mobile}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {c.mobile && (
                      <>
                        <a 
                          href={`tel:+91${cleanPhone}`}
                          className="contact-btn btn-call"
                          title="Call candidate"
                        >
                          <Phone size={13} />
                        </a>
                        <a 
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contact-btn btn-whatsapp"
                          title="Send WhatsApp message"
                        >
                          <MessageSquare size={13} />
                        </a>
                        <button 
                          type="button" 
                          className="contact-btn btn-copy"
                          title="Copy phone"
                          onClick={(e) => handleCopyPhone(e, c.mobile, c.name)}
                        >
                          <Copy size={13} />
                        </button>
                      </>
                    )}
                    <button 
                      type="button" 
                      className="contact-btn"
                      title="Edit / Notes"
                      onClick={() => onSelectCandidate(c)}
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
};
