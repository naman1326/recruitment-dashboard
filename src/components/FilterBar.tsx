import React from 'react';
import { Search, X, Clock, Columns, Table as TableIcon } from 'lucide-react';
import { CandidateStatus, PanelType, TimeSlotType, ViewMode } from '../types';
import { TIME_SLOTS, PANEL_LIST } from '../constants/panels';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPanel: PanelType | 'ALL';
  onSelectPanel: (p: PanelType | 'ALL') => void;
  selectedSlot: TimeSlotType | 'ALL';
  onSelectSlot: (s: TimeSlotType | 'ALL') => void;
  selectedStatus: CandidateStatus | 'ALL';
  onSelectStatus: (st: CandidateStatus | 'ALL') => void;
  selectedCategory: string | 'ALL';
  onSelectCategory: (cat: string | 'ALL') => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  totalFiltered: number;
  totalCandidates: number;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPanel,
  onSelectPanel,
  selectedSlot,
  onSelectSlot,
  selectedStatus,
  onSelectStatus,
  selectedCategory,
  onSelectCategory,
  viewMode,
  onViewModeChange,
  totalFiltered,
  totalCandidates,
  onResetFilters
}) => {
  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedPanel !== 'ALL' || 
    selectedSlot !== 'ALL' || 
    selectedStatus !== 'ALL' ||
    selectedCategory !== 'ALL';

  return (
    <div className="toolbar-container">
      {/* Top Search + View Mode row */}
      <div className="toolbar-row-top">
        <div className="search-box-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search candidates by name, roll no, phone, or domain (e.g. Design, Cultural)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="view-mode-tabs">
          <button 
            type="button" 
            className={`view-mode-tab ${viewMode === 'by-slot' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('by-slot')}
            title="Grouped by Time Slot"
          >
            <Clock size={15} />
            <span>By Slot</span>
          </button>
          <button 
            type="button" 
            className={`view-mode-tab ${viewMode === 'by-panel' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('by-panel')}
            title="Grouped by Panel"
          >
            <Columns size={15} />
            <span>By Panel</span>
          </button>
          <button 
            type="button" 
            className={`view-mode-tab ${viewMode === 'table' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('table')}
            title="Dense Table View"
          >
            <TableIcon size={15} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Filter rows */}
      <div className="filters-row">
        {/* Panel filter */}
        <div className="filter-group">
          <span className="filter-label">Panel:</span>
          <div className="filter-chips">
            <button 
              type="button" 
              className={`filter-chip ${selectedPanel === 'ALL' ? 'is-active' : ''}`}
              onClick={() => onSelectPanel('ALL')}
            >
              All Panels
            </button>
            {PANEL_LIST.map((panel, idx) => (
              <button 
                key={panel} 
                type="button" 
                className={`filter-chip chip-panel-${idx + 1} ${selectedPanel === panel ? 'is-active' : ''}`}
                onClick={() => onSelectPanel(panel)}
              >
                {panel}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slot filter */}
        <div className="filter-group">
          <span className="filter-label">Slot:</span>
          <div className="filter-chips">
            <button 
              type="button" 
              className={`filter-chip ${selectedSlot === 'ALL' ? 'is-active' : ''}`}
              onClick={() => onSelectSlot('ALL')}
            >
              All Slots
            </button>
            {TIME_SLOTS.map((slot) => (
              <button 
                key={slot.id} 
                type="button" 
                className={`filter-chip ${selectedSlot === slot.id ? 'is-active' : ''}`}
                onClick={() => onSelectSlot(slot.id)}
              >
                <span>Slot {slot.number}</span>
                <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>({slot.id})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <div className="filter-chips">
            <button 
              type="button" 
              className={`filter-chip ${selectedStatus === 'ALL' ? 'is-active' : ''}`}
              onClick={() => onSelectStatus('ALL')}
            >
              All Statuses
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedStatus === 'scheduled' ? 'is-active' : ''}`}
              onClick={() => onSelectStatus('scheduled')}
            >
              Scheduled
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedStatus === 'interviewing' ? 'is-active' : ''}`}
              onClick={() => onSelectStatus('interviewing')}
              style={selectedStatus === 'interviewing' ? { background: '#38bdf8', color: '#000' } : undefined}
            >
              Interviewing
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedStatus === 'completed' ? 'is-active' : ''}`}
              onClick={() => onSelectStatus('completed')}
              style={selectedStatus === 'completed' ? { background: 'var(--confirm)' } : undefined}
            >
              Completed
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedStatus === 'on-hold' ? 'is-active' : ''}`}
              onClick={() => onSelectStatus('on-hold')}
              style={selectedStatus === 'on-hold' ? { background: 'var(--brand-saffron-alt)' } : undefined}
            >
              On Hold
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedStatus === 'absent' ? 'is-active' : ''}`}
              onClick={() => onSelectStatus('absent')}
              style={selectedStatus === 'absent' ? { background: 'var(--duplicate)' } : undefined}
            >
              Absent
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="filter-group">
          <span className="filter-label">Category:</span>
          <div className="filter-chips">
            <button 
              type="button" 
              className={`filter-chip ${selectedCategory === 'ALL' ? 'is-active' : ''}`}
              onClick={() => onSelectCategory('ALL')}
            >
              All Categories
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedCategory === 'Filled Form Late' ? 'is-active' : ''}`}
              onClick={() => onSelectCategory('Filled Form Late')}
              style={selectedCategory === 'Filled Form Late' ? { background: '#ff9933', color: '#000' } : undefined}
            >
              Late Form
            </button>
            <button 
              type="button" 
              className={`filter-chip ${selectedCategory === 'Missed First Interview' ? 'is-active' : ''}`}
              onClick={() => onSelectCategory('Missed First Interview')}
              style={selectedCategory === 'Missed First Interview' ? { background: '#ec4899', color: '#fff' } : undefined}
            >
              Missed 1st Interview
            </button>
          </div>
        </div>
      </div>

      {/* Results Strip */}
      <div className="results-strip">
        <span>
          Showing <strong>{totalFiltered}</strong> of <strong>{totalCandidates}</strong> candidates
        </span>
        {hasActiveFilters && (
          <button 
            type="button" 
            className="reset-filter-btn"
            onClick={onResetFilters}
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};
