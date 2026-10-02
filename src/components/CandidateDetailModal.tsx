import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Copy, 
  Trash2, 
  Save
} from 'lucide-react';
import { Candidate, CandidateStatus, PanelConfig, PanelType, TimeSlotType } from '../types';
import { TIME_SLOTS, PANEL_LIST, STATUS_CONFIG } from '../constants/panels';
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
                <span style={{ fontSize: '0.8rem', color: panelConfig.color, fontWeight: 600 }}>
                  {panel}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {timeSlot}
                </span>
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
