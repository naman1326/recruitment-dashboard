import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  PANELS_STORAGE_KEY,
  OLD_SLOT_MAP
} from './constants/panels';
import { hydrateFromShareUrl } from './utils/shareUtils';
import { useCloudSync } from './hooks/useCloudSync';
import { Header } from './components/Header';
import { PanelBanner } from './components/PanelBanner';
import { StatsStrip } from './components/StatsStrip';
import { FilterBar } from './components/FilterBar';
import { CandidateCard } from './components/CandidateCard';
import { TableView } from './components/TableView';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { AddCandidateModal } from './components/AddCandidateModal';
import { ImportModal } from './components/ImportModal';
import { SyncModal } from './components/SyncModal';
import { ToastProvider, useToast } from './components/Toast';

const DashboardContent: React.FC = () => {
  const { showToast } = useToast();

  // Candidates state with LocalStorage persistence
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      // Clear legacy storage versions to prevent stale slot formats
      localStorage.removeItem('recruitment_interview_members_v1');
      localStorage.removeItem('recruitment_interview_members_v2');

      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        saved = localStorage.getItem('recruitment_interview_members_v3');
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initMap = new Map(INITIAL_CANDIDATES.map(c => [c.id, c]));
          const existingIds = new Set(parsed.map((c: Candidate) => c.id));

          const hydrated = parsed.map((c: Candidate) => {
            const init = initMap.get(c.id) || INITIAL_CANDIDATES.find(i => 
              (c.rollNo && i.rollNo && i.rollNo.toLowerCase() === c.rollNo.toLowerCase()) || 
              i.name.toLowerCase() === c.name.toLowerCase()
            );
            const rawSlot = c.timeSlot || init?.timeSlot || '10:30 - 11:00 AM';
            const timeSlot = OLD_SLOT_MAP[rawSlot] || rawSlot;

            const isLocalEvaluated = c.status !== 'scheduled' || c.score !== undefined || (c.notes && c.notes.trim()) || c.preferredDept;
            const isInitEvaluated = init && (init.status !== 'scheduled' || init.score !== undefined || (init.notes && init.notes.trim()) || init.preferredDept);

            let status = c.status;
            let score = c.score;
            let notes = c.notes;
            let preferredDept = c.preferredDept || init?.preferredDept || undefined;
            let updatedAt = c.updatedAt || init?.updatedAt;

            if (!isLocalEvaluated && isInitEvaluated && init) {
              status = init.status;
              score = init.score;
              notes = init.notes;
              preferredDept = init.preferredDept;
              updatedAt = init.updatedAt;
            }

            return {
              ...init,
              ...c,
              domainPref1: init?.domainPref1 || c.domainPref1,
              domainPref2: init?.domainPref2 || c.domainPref2,
              status,
              score,
              notes,
              fitReason: init?.fitReason || c.fitReason || '',
              clubMotivation: init?.clubMotivation || c.clubMotivation || '',
              category: init?.category || c.category,
              timeSlot,
              preferredDept,
              updatedAt
            };
          });

          // Ensure any candidates from INITIAL_CANDIDATES (e.g. Panel 5 candidates) missing in saved state are added
          const missingFromInit = INITIAL_CANDIDATES.filter(i => !existingIds.has(i.id));
          const finalMap = new Map<string, Candidate>();
          for (const cand of [...hydrated, ...missingFromInit]) {
            if (!finalMap.has(cand.id)) {
              finalMap.set(cand.id, cand);
            }
          }
          return Array.from(finalMap.values());
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
      const saved = localStorage.getItem(PANELS_STORAGE_KEY) || localStorage.getItem('recruitment_interview_panels_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PANEL_CONFIGS,
          ...parsed,
          'Panel 5': parsed['Panel 5'] || INITIAL_PANEL_CONFIGS['Panel 5']
        };
      }
    } catch (e) {
      console.error('Failed reading panel configs from localStorage:', e);
    }
    return INITIAL_PANEL_CONFIGS;
  });

  // Active Modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Cloud Sync Integration (Zero Database Required)
  const handleApplyRemoteCandidates = useCallback((remoteCandidates: Candidate[]) => {
    setCandidates(remoteCandidates);
  }, []);

  const handleRemoteCandidateChanged = useCallback((changed: Candidate, old?: Candidate) => {
    if (old && old.status !== changed.status) {
      showToast(`⚡ Live update: ${changed.name} marked ${changed.status.toUpperCase()} (${changed.panel})`);
    } else if (old && old.score !== changed.score && changed.score !== undefined) {
      showToast(`⚡ Live update: ${changed.name} score updated to ${changed.score}/10`);
    } else {
      showToast(`⚡ Live update: ${changed.name} updated from another device`);
    }
  }, [showToast]);

  const {
    roomId,
    setRoomId,
    syncStatus,
    lastSyncTime,
    flashingCandidateId,
    forceSyncNow,
    pushUpdate,
    pushFullSchedule
  } = useCloudSync({
    candidates,
    onApplyRemoteCandidates: handleApplyRemoteCandidates,
    onCandidateChangedRemotely: handleRemoteCandidateChanged
  });

  // Filter and View state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedPanel: 'ALL',
    selectedSlot: 'ALL',
    selectedStatus: 'ALL',
    selectedCategory: 'ALL',
    viewMode: 'by-slot'
  });

  // Check URL hash for shared data on initial load
  useEffect(() => {
    const loadShared = async () => {
      const shared = await hydrateFromShareUrl();
      if (shared && shared.candidates && shared.candidates.length > 0) {
        const mappedCandidates = shared.candidates.map(c => {
          const rawSlot = c.timeSlot || '10:30 - 11:00 AM';
          return {
            ...c,
            timeSlot: OLD_SLOT_MAP[rawSlot] || rawSlot
          };
        });
        setCandidates(mappedCandidates);
        if (shared.panelConfigs) {
          setPanelConfigs(shared.panelConfigs);
        }
        pushFullSchedule(mappedCandidates);
        showToast(`Hydrated ${mappedCandidates.length} candidates from shared link!`);
      }
    };
    loadShared();
  }, [showToast, pushFullSchedule]);

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
    const target = candidates.find(c => c.id === id);
    if (target) {
      const updated: Candidate = {
        ...target,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      setCandidates(prev => prev.map(c => c.id === id ? updated : c));
      pushUpdate(updated);
    }
  };

  const handleMoveSlot = (id: string, newSlot: TimeSlotType) => {
    const target = candidates.find(c => c.id === id);
    if (target) {
      const updated: Candidate = {
        ...target,
        timeSlot: newSlot,
        updatedAt: new Date().toISOString()
      };
      setCandidates(prev => prev.map(c => c.id === id ? updated : c));
      pushUpdate(updated);
      showToast(`Candidate moved to ${newSlot}`);
    }
  };

  const handleUpdateCandidate = (updated: Candidate) => {
    const updatedWithTime: Candidate = {
      ...updated,
      updatedAt: new Date().toISOString()
    };
    setCandidates(prev => prev.map(c => c.id === updated.id ? updatedWithTime : c));
    pushUpdate(updatedWithTime);
  };

  const handleUpdatePreferredDept = (id: string, dept?: string) => {
    const target = candidates.find(c => c.id === id);
    if (target) {
      const updated: Candidate = {
        ...target,
        preferredDept: dept,
        updatedAt: new Date().toISOString()
      };
      setCandidates(prev => prev.map(c => c.id === id ? updated : c));
      pushUpdate(updated);
      if (dept) {
        showToast(`Preferred department for ${target.name} set to ${dept}`);
      } else {
        showToast(`Preferred department cleared for ${target.name}`);
      }
    }
  };

  const handleDeleteCandidate = (id: string) => {
    const nextList = candidates.filter(c => c.id !== id);
    setCandidates(nextList);
    pushFullSchedule(nextList);
  };

  const handleAddCandidate = (newCandidate: Candidate) => {
    const nextList = [newCandidate, ...candidates];
    setCandidates(nextList);
    pushFullSchedule(nextList);
  };

  const handleImportSuccess = (
    importedCandidates: Candidate[], 
    mode: 'replace' | 'append',
    parsedInterviewers?: Partial<Record<PanelType, string[]>>
  ) => {
    const nextList = mode === 'replace' ? importedCandidates : [...candidates, ...importedCandidates];
    setCandidates(nextList);
    pushFullSchedule(nextList);

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
    if (window.confirm('Reset candidate schedule back to default dataset (including Panel 5)?')) {
      setCandidates(INITIAL_CANDIDATES);
      setPanelConfigs(INITIAL_PANEL_CONFIGS);
      pushFullSchedule(INITIAL_CANDIDATES);
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

      // Category filter
      if (filters.selectedCategory !== 'ALL' && c.category !== filters.selectedCategory) {
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
        const matchesPreferred = c.preferredDept?.toLowerCase().includes(q) ?? false;
        const matchesFit = c.fitReason?.toLowerCase().includes(q) ?? false;
        const matchesMot = c.clubMotivation?.toLowerCase().includes(q) ?? false;
        const matchesCategory = c.category?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesRoll && !matchesPhone && !matchesDomain1 && !matchesDomain2 && !matchesPreferred && !matchesFit && !matchesMot && !matchesCategory) {
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
        onOpenSync={() => setIsSyncModalOpen(true)}
        syncStatus={syncStatus}
        roomId={roomId}
      />

      {/* Panels Banner with Interviewers */}
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
        selectedCategory={filters.selectedCategory}
        onSelectCategory={(cat) => setFilters(prev => ({ ...prev, selectedCategory: cat }))}
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
        selectedCategory={filters.selectedCategory}
        onSelectCategory={(cat) => setFilters(prev => ({ ...prev, selectedCategory: cat }))}
        viewMode={filters.viewMode}
        onViewModeChange={(m) => setFilters(prev => ({ ...prev, viewMode: m }))}
        totalFiltered={filteredCandidates.length}
        totalCandidates={candidates.length}
        onResetFilters={() => setFilters({
          searchQuery: '',
          selectedPanel: 'ALL',
          selectedSlot: 'ALL',
          selectedStatus: 'ALL',
          selectedCategory: 'ALL',
          viewMode: filters.viewMode
        })}
      />

      {/* Content Rendering by View Mode */}
      {filters.viewMode === 'by-slot' && (
        <div className="slots-container">
          {TIME_SLOTS.map(slot => {
            const slotCandidates = filteredCandidates.filter(c => c.timeSlot === slot.id);

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
                        onUpdatePreferredDept={handleUpdatePreferredDept}
                        isFlashing={flashingCandidateId === c.id}
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
                        onUpdatePreferredDept={handleUpdatePreferredDept}
                        isFlashing={flashingCandidateId === c.id}
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
          onUpdatePreferredDept={handleUpdatePreferredDept}
          flashingCandidateId={flashingCandidateId}
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

      {/* Multi-Device Cloud Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        roomId={roomId}
        onUpdateRoomId={setRoomId}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        totalCandidates={candidates.length}
        onForceSync={forceSyncNow}
        onPushAllToCloud={() => pushFullSchedule(candidates)}
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
