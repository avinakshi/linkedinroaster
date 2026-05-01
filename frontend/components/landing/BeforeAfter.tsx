'use client';

import { useState } from 'react';

/**
 * Before/After "See the Transformation" section — final convincer right before pricing.
 * Desktop: side-by-side cards. Mobile: tab toggle (one card visible).
 */
export default function BeforeAfter() {
  const [tab, setTab] = useState<'before' | 'after'>('after');

  return (
    <>
      {/* Desktop */}
      <section className="hidden md:block" style={{
        position: 'relative',
        padding: 'clamp(80px, 10vw, 120px) 0',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 50%, #F5F5F7 100%)',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: 'min(50vw, 500px)', height: 500,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.10) 0%, transparent 60%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '10%', left: '-5%',
          width: 'min(40vw, 400px)', height: 400,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              color: 'var(--accent-deep)', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(238, 242, 255, 0.8)', border: '1px solid rgba(79, 70, 229, 0.18)',
            }}>Real transformation</div>
            <h2 style={{
              fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.035em',
              marginTop: 20, marginBottom: 16, lineHeight: 1.05,
            }}>
              The same person.<br /><span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                color: 'transparent', WebkitTextFillColor: 'transparent',
              }}>A completely different impression.</span>
            </h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
              Watch what 90 seconds of AI rewriting does to a profile that was getting zero recruiter messages.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 20, maxWidth: 1000, margin: '0 auto', alignItems: 'start', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Before */}
            <div style={{ opacity: 0.85, flex: '1 1 400px', minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>Before</span>
                <span style={{ padding: '4px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Score: 38/100</span>
              </div>
              <div style={{ background: '#FEF2F2', borderRadius: 20, padding: 16, border: '2px solid #FECACA', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Rajesh Kumar</div>
                    <div style={{ fontSize: 12, color: '#DC2626', fontStyle: 'italic' }}>&ldquo;Software Engineer | Python | Java | AWS | Docker | Seeking opportunities&rdquo;</div>
                  </div>
                  <div style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>ABOUT</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>Passionate results-driven professional with excellent communication skills and a can-do attitude. Looking for exciting opportunities to leverage my skills and grow in a dynamic environment.</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>EXPERIENCE</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 6 }}>Software Engineer at TechCorp</div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', marginBottom: 4, textDecoration: 'line-through' }}>&bull; Worked on various projects</div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', marginBottom: 4, textDecoration: 'line-through' }}>&bull; Handled backend development</div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', marginBottom: 12, textDecoration: 'line-through' }}>&bull; Participated in team meetings</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {['Missing keywords', 'Weak headline', 'No metrics'].map(w => (
                        <span key={w} style={{ padding: '3px 8px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 200 }}>
              <div aria-hidden="true" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)', fontSize: 18, color: 'white' }}>&rarr;</div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: '#DC2626' }}>42</span>
                <span style={{ color: 'var(--text-muted)' }}> &rarr; </span>
                <span style={{ color: '#15803D' }}>87</span>
              </div>
            </div>

            {/* After */}
            <div style={{ flex: '1 1 400px', minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#15803D' }}>After</span>
                <span style={{ padding: '4px 12px', background: '#DCFCE7', color: '#15803D', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Score: 87/100</span>
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 20, padding: 16, border: '2px solid #BBF7D0', boxShadow: '0 16px 48px rgba(15,23,42,0.12)' }}>
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Rajesh Kumar</div>
                    <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>&ldquo;Full-Stack Engineer | Built apps serving 50K+ users | React + AWS + Node.js | 5 yrs&rdquo;</div>
                  </div>
                  <div style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#15803D', letterSpacing: 1, marginBottom: 8 }}>ABOUT</div>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>Full-stack engineer with 5 years shipping production applications at scale. Led microservices migration serving 50K+ DAU with 99.9% uptime. Reduced API latency by 40% and mentored 4 junior developers. B.Tech CS from IIT Delhi.</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#15803D', letterSpacing: 1, marginBottom: 8 }}>EXPERIENCE</div>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, fontWeight: 600, marginBottom: 6 }}>Senior Software Engineer at TechCorp</div>
                    <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>&bull; <span style={{ background: '#D1FAE5', padding: '1px 4px', borderRadius: 3 }}>Led team of 8 engineers delivering 3 products generating $2M ARR</span></div>
                    <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>&bull; <span style={{ background: '#D1FAE5', padding: '1px 4px', borderRadius: 3 }}>Reduced API response latency by 40% via query optimization</span></div>
                    <div style={{ fontSize: 11, color: '#374151', marginBottom: 12 }}>&bull; <span style={{ background: '#D1FAE5', padding: '1px 4px', borderRadius: 3 }}>Architected microservices serving 50K+ daily users, 99.9% uptime</span></div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {['ATS Optimized', '12 Keywords Added', 'Quantified Impact'].map(w => (
                        <span key={w} style={{ padding: '3px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile */}
      <section className="md:hidden" style={{ padding: 'clamp(40px, 8vw, 80px) 0', background: '#F8FBFF' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Real results</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>See the Transformation</h2>
          </div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#F1F5F9', borderRadius: 12, padding: 4 }}>
            <button type="button" onClick={() => setTab('before')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === 'before' ? 'white' : 'transparent', color: tab === 'before' ? '#DC2626' : 'var(--text-secondary)', boxShadow: tab === 'before' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              Before &mdash; 38/100
            </button>
            <button type="button" onClick={() => setTab('after')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === 'after' ? 'white' : 'transparent', color: tab === 'after' ? '#15803D' : 'var(--text-secondary)', boxShadow: tab === 'after' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              After &mdash; 87/100
            </button>
          </div>
          {tab === 'before' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '2px solid #FECACA', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: '#E2E8F0' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Rajesh Kumar</div>
                  <div style={{ fontSize: 10, color: '#DC2626', fontWeight: 600 }}>Score: 38/100</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.5, padding: '10px 12px', background: '#FEF2F2', borderRadius: 8, marginBottom: 12, borderLeft: '3px solid #F87171', fontStyle: 'italic' }}>
                &ldquo;Software Engineer | Python | Java | AWS | Seeking opportunities&rdquo;
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>Passionate results-driven professional with excellent communication skills...</div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4, textDecoration: 'line-through' }}>&bull; Worked on various projects</div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4, textDecoration: 'line-through' }}>&bull; Handled backend development</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {['Weak headline', 'Missing keywords', 'No metrics'].map(w => (
                  <span key={w} style={{ padding: '3px 8px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{w}</span>
                ))}
              </div>
            </div>
          )}
          {tab === 'after' && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '2px solid #BBF7D0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Rajesh Kumar</div>
                  <div style={{ fontSize: 10, color: '#15803D', fontWeight: 600 }}>Score: 87/100</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#15803D', lineHeight: 1.5, padding: '10px 12px', background: '#F0FDF4', borderRadius: 8, marginBottom: 12, fontWeight: 600, borderLeft: '3px solid #34D399' }}>
                &ldquo;Full-Stack Engineer | Built apps serving 50K+ users | React + AWS&rdquo;
              </div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>Full-stack engineer with 5 years shipping production applications. Led microservices migration for 50K+ DAU.</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>&bull; <span style={{ background: '#D1FAE5', padding: '1px 4px', borderRadius: 3 }}>Led team of 8 engineers delivering $2M ARR</span></div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>&bull; <span style={{ background: '#D1FAE5', padding: '1px 4px', borderRadius: 3 }}>Reduced API latency by 40%</span></div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {['ATS Optimized', '12 Keywords', 'Quantified Impact'].map(w => (
                  <span key={w} style={{ padding: '3px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{w}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
