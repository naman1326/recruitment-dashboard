import React, { useState, useEffect, useMemo } from 'react';
import { 
  Candidate, 
  CandidateStatus, 
  FilterState, 
  PanelConfig, 
  PanelType, 
  TimeSlotType
} from './types';
import { 
  INITIAL_CANDIDATES, 
  INITIAL_PANEL_CONFIGS 
} from './constants/initialData';
import { 
  TIME_SLOTS, 
  PANEL_LIST, 
  STORAGE_KEY, 
  PANELS_STORAGE_KEY 
} from './constants/panels';
import { hydrateFromShareUrl } from './utils/shareUtils';
import { Header } from './components/Header';
import { PanelBanner } from './components/PanelBanner';
import { StatsStrip } from './components/StatsStrip';
import { FilterBar } from './components/FilterBar';
import { CandidateCard } from './components/CandidateCard';
import { TableView } from './components/TableView';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { AddCandidateModal } from './components/AddCandidateModal';
import { ImportModal } from './components/ImportModal';
import { ToastProvider, useToast } from './components/Toast';

const DashboardContent: React.FC = () => {
  const { showToast } = useToast();

  // Candidates state with LocalStorage persistence
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading localStorage:', e);
    }
    return INITIAL_CANDIDATES;
  });

  // Panel configs state (interviewers) with LocalStorage persistence
  const [panelConfigs, setPanelConfigs] = useState<Record<PanelType, PanelConfig>>(() => {
    try {
      const saved = localStorage.getItem(PANELS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading panel configs from localStorage:', e);
    }
    return INITIAL_PANEL_CONFIGS;
  });

  // Filter and View state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedPanel: 'ALL',
    selectedSlot: 'ALL',
    selectedStatus: 'ALL',
    viewMode: 'by-slot'
  });

  // Active Modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Check URL hash for shared data on initial load
  useEffect(() => {
    const loadShared = async () => {
      const shared = await hydrateFromShareUrl();
      if (shared && shared.candidates && shared.candidates.length > 0) {
        setCandidates(shared.candidates);
        if (shared.panelConfigs) {
          setPanelConfigs(shared.panelConfigs);
        }
        showToast(`Hydrated ${shared.candidates.length} candidates from shared link!`);
      }
    };
    loadShared();
  }, [showToast]);

  // Persist candidates whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.error('Failed writing candidates to localStorage:', e);
    }
  }, [candidates]);

  // Persist panel configs whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(PANELS_STORAGE_KEY, JSON.stringify(panelConfigs));
    } catch (e) {
      console.error('Failed writing panel configs to localStorage:', e);
    }
  }, [panelConfigs]);

  // Candidate updates
  const handleUpdateStatus = (id: string, newStatus: CandidateStatus) => {
    setCandidates(prev => 
      prev.map(c => (c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleMoveSlot = (id: string, newSlot: TimeSlotType) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, timeSlot: newSlot, updatedAt: new Date().toISOString() } : c))
    );
    showToast(`Candidate moved to ${newSlot}`);
  };

  const handleUpdateCandidate = (updated: Candidate) => {
    setCandidates(prev =>
      prev.map(c => (c.id === updated.id ? updated : c))
    );
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCandidate = (newCandidate: Candidate) => {
    setCandidates(prev => [newCandidate, ...prev]);
  };

  const handleImportSuccess = (
    importedCandidates: Candidate[], 
    mode: 'replace' | 'append',
    parsedInterviewers?: Partial<Record<PanelType, string[]>>
  ) => {
    if (mode === 'replace') {
      setCandidates(importedCandidates);
    } else {
      setCandidates(prev => [...prev, ...importedCandidates]);
    }

    if (parsedInterviewers && Object.keys(parsedInterviewers).length > 0) {
      setPanelConfigs(prev => {
        const next = { ...prev };
        for (const [panelKey, interviewers] of Object.entries(parsedInterviewers)) {
          const p = panelKey as PanelType;
          if (next[p] && interviewers && interviewers.length > 0) {
            next[p] = {
              ...next[p],
              interviewers
            };
          }
        }
        return next;
      });
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset candidate schedule back to initial 114 candidates from panel.xlsx?')) {
      setCandidates(INITIAL_CANDIDATES);
      setPanelConfigs(INITIAL_PANEL_CONFIGS);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PANELS_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
      showToast('Reset schedule to default dataset');
    }
  };

  // Filtered Candidates computation
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Panel filter
      if (filters.selectedPanel !== 'ALL' && c.panel !== filters.selectedPanel) {
        return false;
      }

      // Slot filter
      if (filters.selectedSlot !== 'ALL' && c.timeSlot !== filters.selectedSlot) {
        return false;
      }

      // Status filter
      if (filters.selectedStatus !== 'ALL' && c.status !== filters.selectedStatus) {
        return false;
      }

      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRoll = c.rollNo?.toLowerCase().includes(q) ?? false;
        const matchesPhone = c.mobile.includes(q);
        const matchesDomain1 = c.domainPref1?.toLowerCase().includes(q) ?? false;
        const matchesDomain2 = c.domainPref2?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesRoll && !matchesPhone && !matchesDomain1 && !matchesDomain2) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, filters]);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header 
        candidates={candidates}
        panelConfigs={panelConfigs}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAddCandidate={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* 4 Panels Banner with Interviewers */}
      <PanelBanner 
        panelConfigs={panelConfigs}
        candidates={candidates}
        selectedPanel={filters.selectedPanel}
        onSelectPanel={(p) => setFilters(prev => ({ ...prev, selectedPanel: p }))}
      />

      {/* Summary Statistics Strip */}
      <StatsStrip 
        candidates={candidates}
        selectedStatus={filters.selectedStatus}
        onSelectStatus={(st) => setFilters(prev => ({ ...prev, selectedStatus: st }))}
      />

      {/* Search and Filters Bar */}
      <FilterBar 
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters(prev => ({ ...prev, searchQuery: q }))}
        selectedPanel={filters.selectedPanel}
        onSelectPanel={(p) => setFilters(prev => ({ ...prev, selectedPanel: p }))}
        selectedSlot={filters.selectedSlot}
        onSelectSlot={(s) => setFilters(prev => ({ ...prev, selectedSlot: s }))}
        selectedStatus={filters.selectedStatus}
        onSelectStatus={(st) => setFilters(prev => ({ ...prev, selectedStatus: st }))}
        viewMode={filters.viewMode}
        onViewModeChange={(m) => setFilters(prev => ({ ...prev, viewMode: m }))}
        totalFiltered={filteredCandidates.length}
        totalCandidates={candidates.length}
        onResetFilters={() => setFilters({
          searchQuery: '',
          selectedPanel: 'ALL',
          selectedSlot: 'ALL',
          selectedStatus: 'ALL',
          viewMode: filters.viewMode
        })}
      />

      {/* Content Rendering by View Mode */}
      {filters.viewMode === 'by-slot' && (
        <div className="slots-container">
          {TIME_SLOTS.map(slot => {
            // Find candidates belonging to this slot
            const slotCandidates = filteredCandidates.filter(c => c.timeSlot === slot.id);

            // Hide slot if filtered out or empty under current filters
            if (filters.selectedSlot !== 'ALL' && filters.selectedSlot !== slot.id) {
              return null;
            }
            if (slotCandidates.length === 0 && (filters.searchQuery || filters.selectedPanel !== 'ALL' || filters.selectedStatus !== 'ALL')) {
              return null;
            }

            return (
              <div key={slot.id} className="slot-block">
                <div className="slot-header">
                  <div className="slot-title-wrap">
                    <span className="slot-number-badge">{slot.number}</span>
                    <span className="slot-title">{slot.id}</span>
                    {slot.isOverflow && (
                      <span className="slot-badge-overflow">Overflow Session</span>
                    )}
                  </div>
                  <div className="slot-candidate-count">
                    {slotCandidates.length} candidates scheduled
                  </div>
                </div>

                {slotCandidates.length > 0 ? (
                  <div className="slot-cards-grid">
                    {slotCandidates.map(c => (
                      <CandidateCard 
                        key={c.id}
                        candidate={c}
                        panelConfig={panelConfigs[c.panel]}
                        onSelectCandidate={setSelectedCandidate}
                        onUpdateStatus={handleUpdateStatus}
                        onMoveSlot={handleMoveSlot}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No candidates assigned to this slot
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filters.viewMode === 'by-panel' && (
        <div className="panels-columns-container">
          {PANEL_LIST.map(panelKey => {
            if (filters.selectedPanel !== 'ALL' && filters.selectedPanel !== panelKey) {
              return null;
            }

            const pConfig = panelConfigs[panelKey];
            const pCandidates = filteredCandidates.filter(c => c.panel === panelKey);

            return (
              <div key={panelKey} className="panel-column">
                <div className="panel-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: pConfig.color 
                      }} 
                    />
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: pConfig.color }}>
                      {panelKey}
                    </span>
                  </div>
                  <span className="panel-candidate-pill">
                    {pCandidates.length}
                  </span>
                </div>

                <div className="panel-cards-scroll">
                  {pCandidates.length > 0 ? (
                    pCandidates.map(c => (
                      <CandidateCard 
                        key={c.id}
                        candidate={c}
                        panelConfig={pConfig}
                        onSelectCandidate={setSelectedCandidate}
                        onUpdateStatus={handleUpdateStatus}
                        onMoveSlot={handleMoveSlot}
                      />
                    ))
                  ) : (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No candidates in this panel
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filters.viewMode === 'table' && (
        <TableView 
          candidates={filteredCandidates}
          panelConfigs={panelConfigs}
          onSelectCandidate={setSelectedCandidate}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetailModal 
        candidate={selectedCandidate}
        panelConfigs={panelConfigs}
        onClose={() => setSelectedCandidate(null)}
        onUpdateCandidate={handleUpdateCandidate}
        onDeleteCandidate={handleDeleteCandidate}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCandidate={handleAddCandidate}
      />

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
};

export default App;
