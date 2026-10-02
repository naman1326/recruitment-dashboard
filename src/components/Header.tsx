import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  UserPlus, 
  Download, 
  Share2, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText
} from 'lucide-react';
import { Candidate, PanelConfig, PanelType } from '../types';
import { exportToExcel, exportToCSV } from '../utils/excelParser';
import { createShareableUrl } from '../utils/shareUtils';
import { useToast } from './Toast';

interface HeaderProps {
  candidates: Candidate[];
  panelConfigs: Record<PanelType, PanelConfig>;
  onOpenImport: () => void;
  onOpenAddCandidate: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  candidates,
  panelConfigs,
  onOpenImport,
  onOpenAddCandidate,
  onResetData
}) => {
  const { showToast } = useToast();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareUrl = await createShareableUrl(candidates, panelConfigs);
      await navigator.clipboard.writeText(shareUrl);
      showToast('Shareable link copied to clipboard! (URL hash updated)');
    } catch (err) {
      console.error(err);
      showToast('Failed to copy share link', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);
    exportToExcel(candidates, panelConfigs);
    showToast('Exported interview schedule to Excel (.xlsx)');
  };

  const handleExportCSV = () => {
    setShowExportMenu(false);
    exportToCSV(candidates);
    showToast('Exported candidate list to CSV');
  };

  return (
    <header className="dash-header">
      <div className="dash-header-top">
        <div className="dash-brand-container">
          <img 
            src="/logo.png" 
            alt="Swarajya Logo" 
            className="dash-logo"
            onError={(e) => {
              // fallback if not yet copied to root
              (e.target as HTMLImageElement).src = './logo.png';
            }} 
          />
          <div className="brand-text-col">
            <h1 className="brand-title">स्वराज्य</h1>
            <div className="brand-subtitle">
              Recruitment Interview Dashboard
              <span className="brand-subtitle-tag">{candidates.length} Candidates</span>
            </div>
          </div>
        </div>

        <div className="dash-actions">
          {/* Live Clock & Pulse */}
          <div className="live-indicator-container" title="System Live Status">
            <span className="live-dot" />
            <span className="live-text">LIVE</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginLeft: '4px' }}>
              {currentTime}
            </span>
          </div>

          {/* Import Button */}
          <button 
            type="button" 
            className="action-btn"
            onClick={onOpenImport}
            title="Import multi-sheet panel.xlsx or CSV"
          >
            <Upload size={16} color="var(--brand-saffron)" />
            <span>Import Excel</span>
          </button>

          {/* Add Candidate Button */}
          <button 
            type="button" 
            className="action-btn btn-primary"
            onClick={onOpenAddCandidate}
          >
            <UserPlus size={16} />
            <span>Add Candidate</span>
          </button>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="action-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export data"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            {showExportMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '6px',
                  minWidth: '180px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  animation: 'dropdown-fade-in 0.2s ease'
                }}
              >
                <button 
                  type="button" 
                  className="action-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet size={15} color="#1fae5f" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button 
                  type="button" 
                  className="action-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  onClick={handleExportCSV}
                >
                  <FileText size={15} color="#38bdf8" />
                  <span>CSV File (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Share Button */}
          <button 
            type="button" 
            className="action-btn"
            onClick={handleShare}
            disabled={isSharing}
            title="Create short link via Bytebin & hash hydration"
          >
            {isSharing ? <RefreshCw size={16} className="spin" /> : <Share2 size={16} color="var(--brand-saffron-alt)" />}
            <span>Share Link</span>
          </button>

          {/* Reset Button */}
          <button 
            type="button" 
            className="action-btn"
            onClick={onResetData}
            title="Reset to default panel.xlsx candidate dataset"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} color="var(--text-muted)" />
          </button>
        </div>
      </div>
    </header>
  );
};
