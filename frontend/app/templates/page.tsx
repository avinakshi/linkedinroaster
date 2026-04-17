'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { TEMPLATES, renderResumeHTML } from '../../components/resume/ResumeTemplates';

const SAMPLE_DATA = {
  contact: { name: 'Ananya Sharma', email: 'ananya.sharma@gmail.com', phone: '98765-43210', location: 'Mumbai, India', linkedin: 'linkedin.com/in/ananya-sharma', website: 'ananyasharma.com' },
  summary: '7+ years of product management experience driving customer growth across fintech, e-commerce, and SaaS platforms. Increased MAU by 35%, revenue by ₹4.2 Cr, and retention by 28%. Led cross-functional teams of 15+ to deliver products serving 2M+ users.',
  experience: [
    { role: 'Senior Product Manager', company: 'Razorpay', location: 'Bangalore', dates: 'Jan 2022 - Present', bullets: ['Led merchant onboarding platform, increasing conversion by 32% and reducing drop-off by 45% through data-driven UX improvements.', 'Managed team of 12 engineers and 3 designers delivering payment features processing ₹500 Cr+ monthly with 99.98% uptime.', 'Launched instant settlement for 50K+ merchants, driving ₹1.8 Cr incremental monthly revenue.', 'Conducted 200+ customer interviews, improving NPS from 42 to 67.'] },
    { role: 'Product Manager', company: 'Flipkart', location: 'Bangalore', dates: 'Mar 2019 - Dec 2021', bullets: ['Owned seller analytics dashboard for 150K+ sellers, improving GMV by 22% and reducing support tickets by 35%.', 'Launched Flipkart Quick in 8 cities, achieving 4.5-star rating and 40% repeat order rate.', 'Redesigned checkout flow, reducing cart abandonment by 19% and adding ₹12 Cr quarterly revenue.'] },
    { role: 'Associate Product Manager', company: 'Freshworks', location: 'Chennai', dates: 'Jul 2017 - Feb 2019', bullets: ['Built Freshdesk AI chatbot from 0→1, achieving 60% ticket deflection for enterprise clients.', 'Defined pricing tiers contributing ₹3.5 Cr ARR within first year across 200+ accounts.'] },
  ],
  education: [
    { degree: 'MBA Product Management', institution: 'IIM Bangalore', year: '2017', gpa: '8.4/10' },
    { degree: 'B.Tech Computer Science', institution: 'NIT Trichy', year: '2015', gpa: '8.9/10' },
  ],
  skills: { technical: ['SQL', 'Python', 'Jira', 'Confluence', 'Figma', 'Google Analytics', 'Mixpanel', 'Amplitude'], soft: ['Product Strategy', 'Agile/Scrum', 'A/B Testing', 'User Research', 'Stakeholder Management', 'Go-to-Market'] },
  achievements: ['Razorpay Star Performer 2023', 'Published in YourStory', 'ISB Product Fellowship 2022'],
};

const CATEGORIES = ['All', 'ATS-Friendly', 'Professional', 'India'] as const;

function ScaledPreview({ templateId }: { templateId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.35);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => { const w = el.clientWidth; if (w > 0) setZoom(w / 794); };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ background: 'white', borderRadius: 4, overflow: 'hidden', height: 360 }}>
      <div style={{ width: 794, zoom, pointerEvents: 'none' }}>
        {renderResumeHTML(SAMPLE_DATA, templateId)}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [filter, setFilter] = useState<string>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'All') return TEMPLATES;
    return TEMPLATES.filter(t => t.category === filter);
  }, [filter]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#0D9488' }}>Profile</span><span style={{ color: '#0F172A' }}>Roaster</span>
          </a>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="/pricing" style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none' }}>Pricing</a>
            <a href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none' }}>Dashboard</a>
            <a href="/" style={{ padding: '8px 20px', background: '#0D9488', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Get Started</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '64px 24px 48px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Resume Templates
        </h1>
        <p style={{ fontSize: 18, color: '#64748B', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {TEMPLATES.length} ATS-optimized templates. Pick one, we fill it with your rewritten content.
        </p>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: filter === cat ? '1px solid #0D9488' : '1px solid #E2E8F0',
              background: filter === cat ? '#F0FDFA' : 'white',
              color: filter === cat ? '#0D9488' : '#64748B',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              {cat}{cat === 'All' ? ` (${TEMPLATES.length})` : ''}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {filtered.map((t, idx) => (
            <div key={t.id}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                transform: hoveredId === t.id ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredId === t.id ? '0 12px 32px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => window.location.href = '/#pricing'}
            >
              {/* Preview */}
              <div style={{ padding: '12px 12px 0', position: 'relative' }}>
                <ScaledPreview templateId={t.id} />
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: '12px 12px 0 12px', borderRadius: 4,
                  background: 'rgba(13, 148, 136, 0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: hoveredId === t.id ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}>
                  <span style={{ padding: '10px 24px', background: 'white', color: '#0D9488', borderRadius: 10, fontSize: 14, fontWeight: 700 }}>Use This Template</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Included with all plans</span>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{t.description}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {t.ats === 'high' && <span style={{ padding: '2px 8px', background: '#F0FDFA', color: '#0D9488', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>ATS Friendly</span>}
                  {t.ats === 'medium' && <span style={{ padding: '2px 8px', background: '#FFFBEB', color: '#D97706', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>ATS Compatible</span>}
                  {idx < 3 && <span style={{ padding: '2px 8px', background: '#FFF1F2', color: '#E11D48', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>Popular</span>}
                  <span style={{ padding: '2px 8px', background: '#F1F5F9', color: '#64748B', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{t.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: 'white', textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Ready to build your resume?</h2>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>Upload your resume and we fill any template with AI-optimized content.</p>
        <a href="/" style={{ display: 'inline-block', padding: '14px 32px', background: '#0D9488', color: 'white', borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 20px rgba(13,148,136,0.25)' }}>
          Get Started Free
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E2E8F0', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/terms" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Privacy</a>
          <a href="/refund" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Refund</a>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>&copy; 2026 ProfileRoaster. All rights reserved.</p>
      </footer>
    </div>
  );
}
