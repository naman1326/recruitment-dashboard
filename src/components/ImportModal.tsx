import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, Download } from 'lucide-react';
import { Candidate, PanelType } from '../types';
import { parseExcelFile, parseCSVData, downloadExcelTemplate, ParseResult } from '../utils/excelParser';
import { useToast } from './Toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (
    candidates: Candidate[], 
    mode: 'replace' | 'append',
    interviewers?: Partial<Record<PanelType, string[]>>
  ) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  if (!isOpen) return null;

  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setParseResult(null);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isCSV = file.name.endsWith('.csv');

      if (!isExcel && !isCSV) {
        showToast('Please upload an Excel (.xlsx) or CSV (.csv) file', 'error');
        setIsParsing(false);
        return;
      }

      if (isExcel) {
        const result = await parseExcelFile(file);
        if (result.candidates.length === 0) {
          showToast('No candidates found in Panel 1 - 4 sheets. (Panel 5 is excluded)', 'error');
        } else {
          setParseResult(result);
          showToast(`Parsed ${result.candidates.length} candidates across ${result.summary.sheetCount} panels!`);
        }
      } else {
        const text = await file.text();
        const candidates = await parseCSVData(text);
        setParseResult({
          candidates,
          panelInterviewers: {},
          summary: {
            sheetCount: 1,
            sheetsFound: ['CSV'],
            candidatesCount: candidates.length,
            perPanel: { 'Panel 1': candidates.length }
          }
        });
        showToast(`Parsed ${candidates.length} candidates from CSV`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to parse file', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.candidates.length === 0) return;
    onImportSuccess(parseResult.candidates, importMode, parseResult.panelInterviewers);
    showToast(
      importMode === 'replace'
        ? `Replaced schedule with ${parseResult.candidates.length} candidates`
        : `Appended ${parseResult.candidates.length} candidates to schedule`
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Upload size={20} color="var(--brand-saffron)" />
            <h2 className="modal-title">Import Interview Candidate Schedule</h2>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Information Notice */}
          <div 
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 107, 53, 0.08)',
              border: '1px solid rgba(255, 107, 53, 0.25)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}
          >
            <strong style={{ color: 'var(--brand-saffron)' }}>Multi-Sheet Support:</strong> Automatically ingests sheets named <strong>Panel 1, Panel 2, Panel 3, Panel 4</strong>. Row 1 lists Interviewer names, and Row 2+ lists candidates. <em>(Panel 5 is excluded per requirements).</em>
          </div>

          {/* Drag & Drop Box */}
          <div 
            className={`dropzone ${isDragOver ? 'is-dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx,.xls,.csv" 
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <FileSpreadsheet size={44} color="var(--brand-saffron)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {isParsing ? 'Parsing Excel Data...' : 'Choose or Drag & Drop panel.xlsx here'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports .xlsx, .xls, and .csv files
            </div>
          </div>

          {/* Parse Preview if loaded */}
          {parseResult && (
            <div 
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border-medium)',
                borderRadius: '14px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                animation: 'fade-in 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--confirm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> File Validated Successfully
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Total: {parseResult.summary.candidatesCount} candidates
                </span>
              </div>

              {/* Panels Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {Object.entries(parseResult.summary.perPanel).map(([panelName, count]) => (
                  <div 
                    key={panelName}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{panelName}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{count}</div>
                  </div>
                ))}
              </div>

              {/* Interviewers parsed */}
              {Object.keys(parseResult.panelInterviewers).length > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--brand-saffron)' }}>Interviewers detected: </span>
                  {Object.entries(parseResult.panelInterviewers).map(([p, names]) => (
                    <span key={p} style={{ marginRight: '8px' }}>
                      <strong>{p}:</strong> {names?.join(', ')};
                    </span>
                  ))}
                </div>
              )}

              {/* Import Mode Radio */}
              <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Import Mode</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="replace"
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')}
                    />
                    <span>Replace Entire Schedule</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="append"
                      checked={importMode === 'append'} 
                      onChange={() => setImportMode('append')}
                    />
                    <span>Append to Existing</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Download sample template */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
            <button 
              type="button" 
              className="action-btn"
              style={{ fontSize: '0.8rem', background: 'transparent' }}
              onClick={downloadExcelTemplate}
            >
              <Download size={14} color="var(--brand-saffron)" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="action-btn btn-primary"
            disabled={!parseResult || parseResult.candidates.length === 0}
            onClick={handleConfirmImport}
          >
            <Check size={16} />
            <span>Apply Import</span>
          </button>
        </div>
      </div>
    </div>
  );
};
