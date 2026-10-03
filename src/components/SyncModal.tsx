import React, { useState } from 'react';
import { X, Cloud, RefreshCw, Sparkles, Check } from 'lucide-react';
import { SyncStatus } from '../hooks/useCloudSync';
import { DEFAULT_ROOM_ID } from '../utils/cloudSync';
import { useToast } from './Toast';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onUpdateRoomId: (newRoom: string) => void;
  syncStatus: SyncStatus;
  lastSyncTime: string;
  totalCandidates: number;
  onForceSync: () => void;
  onPushAllToCloud: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onUpdateRoomId,
  syncStatus,
  lastSyncTime,
  totalCandidates,
  onForceSync,
  onPushAllToCloud
}) => {
  if (!isOpen) return null;

  const { showToast } = useToast();
  const [inputRoom, setInputRoom] = useState(roomId);
  const [isCopied, setIsCopied] = useState(false);

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoom.trim()) {
      onUpdateRoomId(DEFAULT_ROOM_ID);
      setInputRoom(DEFAULT_ROOM_ID);
    } else {
      onUpdateRoomId(inputRoom.trim());
    }
    showToast(`Switched cloud sync room to "${inputRoom.trim() || DEFAULT_ROOM_ID}"`);
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    showToast('Dashboard URL copied! Open on any other phone or laptop to view live synced updates.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cloud size={20} color="var(--brand-saffron)" />
            <h2 className="modal-title">Multi-Device Cloud Sync</h2>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Zero-DB Feature Highlight Banner */}
          <div 
            style={{
              padding: '0.9rem 1.1rem',
              backgroundColor: 'rgba(255, 107, 53, 0.08)',
              border: '1px solid rgba(255, 107, 53, 0.25)',
              borderRadius: '14px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--brand-saffron)', marginBottom: '4px' }}>
              <Sparkles size={16} /> Zero Database Required
            </div>
            When anyone marks a candidate <strong>Completed</strong> or updates their notes on any phone or laptop, all other devices viewing this website update automatically within seconds!
          </div>

          {/* Sync Status Strip */}
          <div 
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: syncStatus === 'offline' ? '#e2493a' : syncStatus === 'syncing' ? 'var(--brand-saffron)' : 'var(--confirm)',
                  boxShadow: syncStatus === 'connected' ? '0 0 10px rgba(31, 174, 95, 0.8)' : undefined
                }}
              />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {syncStatus === 'syncing' ? 'Syncing with cloud...' : syncStatus === 'offline' ? 'Offline (Cached locally)' : 'Live Cloud Sync Active'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Last synced: {lastSyncTime || 'Just now'} • {totalCandidates} candidates
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="action-btn"
              onClick={onForceSync}
              title="Pull latest updates from cloud right now"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin' : ''} />
              <span>Sync Now</span>
            </button>
          </div>

          {/* Room Configuration Form */}
          <form onSubmit={handleSaveRoom} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Sync Room Code</label>
              <input 
                type="text"
                className="form-input"
                placeholder="swarajya-recruitment-live-2026"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                All devices using this same code will stay synchronized with each other.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button 
                type="submit" 
                className="action-btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Save Room Code
              </button>
              <button 
                type="button"
                className="action-btn"
                onClick={handleCopyLink}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isCopied ? <Check size={15} color="var(--confirm)" /> : <Cloud size={15} />}
                <span>{isCopied ? 'Copied URL!' : 'Share Website URL'}</span>
              </button>
            </div>
          </form>

          {/* Seed Cloud Button */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button 
              type="button" 
              className="action-btn"
              onClick={() => {
                onPushAllToCloud();
                showToast('Broadcasted full schedule to cloud');
              }}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', background: 'transparent' }}
            >
              <RefreshCw size={14} color="var(--brand-saffron)" />
              <span>Force Upload All Candidates to Cloud</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
