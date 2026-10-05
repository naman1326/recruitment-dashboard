import React, { useState, useMemo } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Copy, 
  Trash2, 
  Save,
  Sparkles,
  HelpCircle,
  Check,
  Plus,
  Tag
} from 'lucide-react';
import { Candidate, CandidateStatus, PanelConfig, PanelType, TimeSlotType } from '../types';
import { TIME_SLOTS, PANEL_LIST, STATUS_CONFIG } from '../constants/panels';
import { INITIAL_CANDIDATES } from '../constants/initialData';
import { useToast } from './Toast';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  panelConfigs: Record<PanelType, PanelConfig>;
  onClose: () => void;
  onUpdateCandidate: (updated: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  panelConfigs,
  onClose,
  onUpdateCandidate,
  onDeleteCandidate
}) => {
  if (!candidate) return null;

  const { showToast } = useToast();
  const [name, setName] = useState(candidate.name);
  const [rollNo, setRollNo] = useState(candidate.rollNo || '');
  const [mobile, setMobile] = useState(candidate.mobile);
  const [panel, setPanel] = useState<PanelType>(candidate.panel);
  const [timeSlot, setTimeSlot] = useState<TimeSlotType>(candidate.timeSlot);
  const [domainPref1, setDomainPref1] = useState(candidate.domainPref1 || '');
  const [domainPref2, setDomainPref2] = useState(candidate.domainPref2 || '');
  const [preferredDept, setPreferredDept] = useState<string | undefined>(candidate.preferredDept);

  const initialMatch = useMemo(() => {
    return INITIAL_CANDIDATES.find(c => 
      c.id === candidate.id || 
      (candidate.rollNo && c.rollNo && c.rollNo.toLowerCase() === candidate.rollNo.toLowerCase()) || 
      c.name.toLowerCase() === candidate.name.toLowerCase()
    );
  }, [candidate]);

  const fitReason = candidate.fitReason || initialMatch?.fitReason || '';
  const clubMotivation = candidate.clubMotivation || initialMatch?.clubMotivation || '';
  const [status, setStatus] = useState<CandidateStatus>(candidate.status);
  const [score, setScore] = useState<number | undefined>(candidate.score);
  const [notes, setNotes] = useState(candidate.notes || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const panelConfig = panelConfigs[panel];

  const handleCopyPhone = () => {
    if (!mobile) return;
    navigator.clipboard.writeText(mobile);
    showToast(`Copied ${name}'s phone: +91 ${mobile}`);
  };

  const cleanPhone = mobile.replace(/\D/g, '');
  const waUrl = cleanPhone 
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${name}, this is from the Swarajya recruitment team. Your interview with ${panel} is scheduled for ${timeSlot}. Please report on time.`)}` 
    : '#';

  const handleSave = () => {
    const updated: Candidate = {
      ...candidate,
      name,
      rollNo: rollNo.trim() || undefined,
      mobile: mobile.trim(),
      panel,
      timeSlot,
      domainPref1: domainPref1.trim() || undefined,
      domainPref2: domainPref2.trim() || undefined,
      preferredDept: preferredDept?.trim() || undefined,
      fitReason: fitReason.trim() || undefined,
      clubMotivation: clubMotivation.trim() || undefined,
      status,
      score,
      notes,
      updatedAt: new Date().toISOString()
    };
    onUpdateCandidate(updated);
    showToast(`Updated details for ${name}`);
    onClose();
  };

  const handleDelete = () => {
    onDeleteCandidate(candidate.id);
    showToast(`Candidate ${candidate.name} removed from schedule`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: panelConfig.color
              }}
            />
            <h2 className="modal-title">Candidate Evaluation</h2>
          </div>
          <button 
            type="button" 
            className="close-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Header Strip */}
          <div 
            style={{
              padding: '1rem',
              backgroundColor: 'var(--input-bg)',
              borderRadius: '14px',
              border: `1px solid ${panelConfig.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {candidate.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                {candidate.rollNo && (
                  <span className="roll-badge">{candidate.rollNo}</span>
                )}
                <span style={{ fontSize: '0.8rem', color: panelConfig ? panelConfig.color : 'var(--brand-saffron)', fontWeight: 600 }}>
                  {panel}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {timeSlot}
                </span>
                {(candidate.category || initialMatch?.category) && (
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                    <span 
                      className={`badge-category ${(candidate.category || initialMatch?.category) === 'Filled Form Late' ? 'badge-category-late' : 'badge-category-missed'}`}
                    >
                      {(candidate.category || initialMatch?.category) === 'Filled Form Late' ? 'Late Form' : 'Missed 1st Interview'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Direct Dial & WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {mobile && (
                <>
                  <a 
                    href={`tel:+91${cleanPhone}`}
                    className="contact-btn btn-call"
                    title="Call candidate"
                  >
                    <Phone size={15} />
                  </a>
                  <a 
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-btn btn-whatsapp"
                    title="WhatsApp candidate"
                  >
                    <MessageSquare size={15} />
                  </a>
                  <button 
                    type="button" 
                    className="contact-btn btn-copy"
                    onClick={handleCopyPhone}
                    title="Copy phone"
                  >
                    <Copy size={15} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status Selection Buttons */}
          <div className="form-group">
            <label className="form-label">Interview Status</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['scheduled', 'interviewing', 'completed', 'on-hold', 'absent'] as CandidateStatus[]).map((st) => {
                const conf = STATUS_CONFIG[st];
                const isActive = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className="filter-chip"
                    style={{
                      backgroundColor: isActive ? conf.color : 'var(--input-bg)',
                      color: isActive ? '#000' : 'var(--text-secondary)',
                      borderColor: isActive ? conf.color : 'var(--border-subtle)',
                      fontWeight: 700
                    }}
                  >
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Candidate Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Registration / Roll No */}
            <div className="form-group">
              <label className="form-label">Roll / Reg No</label>
              <input 
                type="text" 
                className="form-input"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
              />
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label">Mobile Number (10 digits)</label>
              <input 
                type="text" 
                className="form-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            {/* Rating / Score */}
            <div className="form-group">
              <label className="form-label">Interview Score (out of 10)</label>
              <input 
                type="number" 
                min={0}
                max={10}
                step={0.5}
                className="form-input"
                placeholder="e.g. 8.5"
                value={score ?? ''}
                onChange={(e) => setScore(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </div>

            {/* Assigned Panel */}
            <div className="form-group">
              <label className="form-label">Interview Panel</label>
              <select 
                className="form-select"
                value={panel}
                onChange={(e) => setPanel(e.target.value as PanelType)}
              >
                {PANEL_LIST.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Assigned Time Slot */}
            <div className="form-group">
              <label className="form-label">Interview Time Slot</label>
              <select 
                className="form-select"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlotType)}
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Domain Preference 1 */}
            <div className="form-group">
              <label className="form-label">Domain Preference 1</label>
              <input 
                type="text" 
                className="form-input"
                value={domainPref1}
                onChange={(e) => setDomainPref1(e.target.value)}
              />
            </div>

            {/* Domain Preference 2 */}
            <div className="form-group">
              <label className="form-label">Domain Preference 2</label>
              <input 
                type="text" 
                className="form-input"
                value={domainPref2}
                onChange={(e) => setDomainPref2(e.target.value)}
              />
            </div>
          </div>

          {/* Choose Preferred Department */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={13} color="var(--brand-saffron)" />
              <span>Choose Preferred Department</span>
            </label>
            <div className="domain-tags-wrap" style={{ gap: '0.5rem', marginTop: '0.2rem', alignItems: 'center' }}>
              {domainPref1 && (
                <button
                  type="button"
                  className={`domain-btn ${preferredDept === domainPref1 ? 'selected' : ''}`}
                  onClick={() => setPreferredDept(preferredDept === domainPref1 ? undefined : domainPref1)}
                  title={preferredDept === domainPref1 ? 'Selected (click to unselect)' : `Choose ${domainPref1}`}
                >
                  {preferredDept === domainPref1 ? <Check size={12} /> : <Tag size={11} />}
                  <span>{domainPref1}</span>
                </button>
              )}
              {domainPref2 && (
                <button
                  type="button"
                  className={`domain-btn ${preferredDept === domainPref2 ? 'selected' : ''}`}
                  onClick={() => setPreferredDept(preferredDept === domainPref2 ? undefined : domainPref2)}
                  title={preferredDept === domainPref2 ? 'Selected (click to unselect)' : `Choose ${domainPref2}`}
                >
                  {preferredDept === domainPref2 ? <Check size={12} /> : null}
                  <span>{domainPref2}</span>
                </button>
              )}
              {(() => {
                const isOther = Boolean(
                  preferredDept &&
                  preferredDept !== domainPref1 &&
                  preferredDept !== domainPref2
                );
                return (
                  <button
                    type="button"
                    className={`domain-btn other-btn ${isOther ? 'selected' : ''}`}
                    onClick={() => {
                      const currentVal = isOther ? preferredDept : '';
                      const promptVal = window.prompt(`Enter preferred department for ${name}${isOther ? ' (leave empty to unselect)' : ''}:`, currentVal || '');
                      if (promptVal !== null) {
                        const trimmed = promptVal.trim();
                        setPreferredDept(trimmed ? trimmed : undefined);
                      }
                    }}
                    title={isOther ? `Custom preferred department: ${preferredDept} (click to change/clear)` : 'Enter other department manually'}
                  >
                    {isOther ? <Check size={12} /> : <Plus size={11} />}
                    <span>{isOther ? preferredDept : 'Other...'}</span>
                  </button>
                );
              })()}
              {preferredDept && (
                <button
                  type="button"
                  onClick={() => setPreferredDept(undefined)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px 6px'
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Candidate Form Responses (Why Good Fit & Club Motivation) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Question 1: Good Fit */}
            <div 
              style={{
                padding: '0.9rem 1rem',
                backgroundColor: 'rgba(255, 107, 53, 0.05)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-saffron)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <HelpCircle size={15} /> Why a Good Fit & Relevant Skills
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '2px', lineHeight: 1.35 }}>
                What makes you a good fit for the department(s) you have selected? Feel free to share any relevant skills, experiences, or previous work that align with your preferred department.
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.5, backgroundColor: 'var(--input-bg)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                {fitReason ? fitReason : <span style={{ color: 'var(--text-muted)' }}>No response provided.</span>}
              </div>
            </div>

            {/* Question 2: Why Swarajya */}
            <div 
              style={{
                padding: '0.9rem 1rem',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Sparkles size={15} /> What Excites You About Swarajya - MLA Club
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '2px', lineHeight: 1.35 }}>
                What excites or fascinates you about joining the Swarajya - MLA Club?
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.5, backgroundColor: 'var(--input-bg)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                {clubMotivation ? clubMotivation : <span style={{ color: 'var(--text-muted)' }}>No response provided.</span>}
              </div>
            </div>
          </div>

          {/* Interview Notes / Evaluation Feedback */}
          <div className="form-group">
            <label className="form-label">Interview Notes & Observations</label>
            <textarea 
              className="form-textarea"
              placeholder="Record candidate strengths, technical answers, communication skills, domain fit, or reasons for hold/reject..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Delete candidate confirmation section */}
          {showConfirmDelete ? (
            <div 
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(226, 73, 58, 0.1)',
                border: '1px solid rgba(226, 73, 58, 0.4)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <span style={{ color: '#fca5a5', fontSize: '0.85rem' }}>
                Are you sure you want to remove <strong>{candidate.name}</strong>?
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="action-btn"
                  style={{ background: 'var(--duplicate)', color: '#fff', border: 'none' }}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </button>
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button 
                type="button" 
                className="action-btn"
                style={{ color: '#f87171', borderColor: 'rgba(226, 73, 58, 0.3)', background: 'transparent' }}
                onClick={() => setShowConfirmDelete(true)}
              >
                <Trash2 size={15} />
                <span>Remove Candidate</span>
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="action-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="action-btn btn-primary"
            onClick={handleSave}
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
