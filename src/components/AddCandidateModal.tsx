import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Candidate, CandidateStatus, PanelType, TimeSlotType } from '../types';
import { TIME_SLOTS, PANEL_LIST } from '../constants/panels';
import { normalizePhone } from '../utils/excelParser';
import { useToast } from './Toast';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCandidate: (candidate: Candidate) => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onAddCandidate
}) => {
  if (!isOpen) return null;

  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [mobile, setMobile] = useState('');
  const [panel, setPanel] = useState<PanelType>('Panel 1');
  const [timeSlot, setTimeSlot] = useState<TimeSlotType>(TIME_SLOTS[0].id);
  const [domainPref1, setDomainPref1] = useState('');
  const [domainPref2, setDomainPref2] = useState('');
  const [status, setStatus] = useState<CandidateStatus>('scheduled');
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Candidate name is required', 'error');
      return;
    }

    const clean = normalizePhone(mobile);
    const newCandidate: Candidate = {
      id: `manual-${Date.now()}`,
      name: name.trim(),
      rollNo: rollNo.trim() || undefined,
      mobile: clean,
      panel,
      timeSlot,
      domainPref1: domainPref1.trim() || undefined,
      domainPref2: domainPref2.trim() || undefined,
      status,
      category: category ? category : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onAddCandidate(newCandidate);
    showToast(`Added ${name} to ${panel}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserPlus size={20} color="var(--brand-saffron)" />
            <h2 className="modal-title">Add Candidate to Interview</h2>
          </div>
          <button 
            type="button" 
            className="close-modal-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration / Roll No</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. 26BCE1234"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (10 digits)</label>
                <input 
                  type="tel" 
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

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

              <div className="form-group">
                <label className="form-label">Interview Slot</label>
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

              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select 
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category / Tag</label>
                <select 
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Standard Candidate</option>
                  <option value="Filled Form Late">Filled Form Late</option>
                  <option value="Missed First Interview">Missed First Interview</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Domain Preference 1</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Technical / Operations / Cultural"
                  value={domainPref1}
                  onChange={(e) => setDomainPref1(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Domain Preference 2</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Design and Content / Social Media"
                  value={domainPref2}
                  onChange={(e) => setDomainPref2(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes & Comments</label>
              <textarea 
                className="form-textarea"
                placeholder="Optional notes or details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
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
              type="submit" 
              className="action-btn btn-primary"
            >
              <UserPlus size={16} />
              <span>Add Candidate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
