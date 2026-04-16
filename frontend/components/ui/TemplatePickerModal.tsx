'use client';

import { useState, useMemo } from 'react';
import { TEMPLATES, renderResumeHTML } from '../resume/ResumeTemplates';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: string;
  resumeData: any;
  onSelect: (templateId: string) => void;
  orderPlan?: string;
}

const CATEGORIES = ['All', 'ATS-Friendly', 'Professional', 'India'] as const;

export default function TemplatePickerModal({ isOpen, onClose, selectedId, resumeData, onSelect, orderPlan }: TemplatePickerModalProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    if (filterCategory === 'All') return TEMPLATES;
    return TEMPLATES.filter(t => t.category === filterCategory);
  }, [filterCategory]);

  if (!isOpen) return null;

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Choose Template
          </h2>
          <button onClick={onClose} className="saas-btn saas-btn-ghost" style={{ padding: '6px 10px', fontSize: 16, lineHeight: 1 }}>
            &#x2715;
          </button>
        </div>

        {/* Filter + Grid */}
        <div style={{ padding: '16px 24px 24px' }}>
          <div className="filter-tabs" style={{ marginBottom: 20 }}>
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-tab${filterCategory === c ? ' active' : ''}`} onClick={() => setFilterCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {filtered.map(t => (
              <div
                key={t.id}
                className={`template-card${selectedId === t.id ? ' selected' : ''}`}
                onClick={() => { onSelect(t.id); onClose(); }}
              >
                {/* A4 scaled preview */}
                <div style={{ height: 226, overflow: 'hidden', position: 'relative', background: 'var(--bg-canvas)' }}>
                  <div style={{ width: 794, height: 1122, transform: 'scale(0.2013)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                    {renderResumeHTML(resumeData, t.id)}
                  </div>
                  {selectedId === t.id && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>&#10003;</span>
                    </div>
                  )}
                </div>
                {/* Card label */}
                <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {t.ats === 'high' && <span className="pill-badge pill-badge-success">ATS High</span>}
                    {t.ats === 'medium' && <span className="pill-badge pill-badge-warning">ATS Medium</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
