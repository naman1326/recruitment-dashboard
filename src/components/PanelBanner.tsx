import React from 'react';
import { Users, UserCheck } from 'lucide-react';
import { Candidate, PanelConfig, PanelType } from '../types';
import { PANEL_LIST } from '../constants/panels';

interface PanelBannerProps {
  panelConfigs: Record<PanelType, PanelConfig>;
  candidates: Candidate[];
  selectedPanel: PanelType | 'ALL';
  onSelectPanel: (panel: PanelType | 'ALL') => void;
}

export const PanelBanner: React.FC<PanelBannerProps> = ({
  panelConfigs,
  candidates,
  selectedPanel,
  onSelectPanel
}) => {
  return (
    <div className="panel-grid-banner">
      {PANEL_LIST.map((panelKey, idx) => {
        const config = panelConfigs[panelKey] || {
          id: panelKey,
          name: panelKey,
          color: '#ec4899',
          bgLight: 'rgba(236, 72, 153, 0.12)',
          borderColor: 'rgba(236, 72, 153, 0.35)',
          badgeClass: 'badge-panel-5',
          interviewers: ['All Core Members']
        };

        const panelCandidates = candidates.filter(c => c.panel === panelKey);
        const interviewingCount = panelCandidates.filter(c => c.status === 'interviewing').length;
        const completedCount = panelCandidates.filter(c => c.status === 'completed').length;
        const isSelected = selectedPanel === panelKey;

        return (
          <div 
            key={panelKey} 
            className={`panel-card-summary panel-${idx + 1} ${isSelected ? 'is-active-filter' : ''}`}
            onClick={() => onSelectPanel(isSelected ? 'ALL' : panelKey)}
            style={{
              cursor: 'pointer',
              border: isSelected ? `2px solid ${config.color}` : undefined
            }}
          >
            <div className="panel-card-header">
              <div className="panel-title-badge" style={{ color: config.color }}>
                <Users size={18} />
                <span>{panelKey}</span>
              </div>
              <div className="panel-candidate-pill">
                {interviewingCount > 0 ? (
                  <span style={{ color: '#38bdf8', marginRight: '4px' }}>
                    {interviewingCount} live /
                  </span>
                ) : completedCount > 0 ? (
                  <span style={{ color: '#1fae5f', marginRight: '4px' }}>
                    {completedCount} done /
                  </span>
                ) : null}
                <span>{panelCandidates.length} candidates</span>
              </div>
            </div>

            <div className="interviewers-list">
              <span className="interviewer-label">Interviewers</span>
              <div className="interviewer-chips">
                {config.interviewers.map((name, i) => (
                  <span key={i} className="interviewer-chip">
                    <UserCheck size={12} color={config.color} />
                    <span>{name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
