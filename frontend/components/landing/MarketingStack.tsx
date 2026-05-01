'use client';

import { useState } from 'react';

const scrollToHero = () => {
  const h = document.querySelector('.pr-hero') as HTMLElement | null;
  h?.scrollIntoView({ behavior: 'smooth' });
};

export default function MarketingStack() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <>
      {/* ── Why Your Profile Isn't Working ── */}
      <section style={{
        position: 'relative',
        padding: 'clamp(80px, 10vw, 120px) 0',
        background: 'linear-gradient(180deg, #0A0A0A 0%, #18181B 100%)',
        color: 'white',
        overflow: 'hidden',
      }}>
        {/* Top gradient accent strip — section transition */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(219, 39, 119, 0.5), rgba(124, 58, 237, 0.5), transparent)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 'min(60vw, 600px)', height: 600,
          background: 'radial-gradient(circle, rgba(219, 39, 119, 0.18) 0%, rgba(124, 58, 237, 0.10) 35%, transparent 65%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              color: '#F9A8D4', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(219, 39, 119, 0.10)', border: '1px solid rgba(219, 39, 119, 0.25)',
            }}>
              The harsh truth
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800,
              letterSpacing: '-0.035em', lineHeight: 1.05,
              marginTop: 20, marginBottom: 0, color: 'white',
            }}>
              3 reasons recruiters<br /><span style={{
                background: 'linear-gradient(135deg, #F9A8D4 0%, #C4B5FD 50%, #A5B4FC 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                color: 'transparent', WebkitTextFillColor: 'transparent',
              }}>skip your profile</span> in 6 seconds
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {[
              {
                title: 'The buzzword headline',
                category: 'Headline',
                person: { name: 'Priya Sharma', role: 'Product Manager', loc: 'Bangalore', avatarSeed: 'priya-sharma' },
                bad: 'Passionate results-driven professional seeking to leverage synergies',
                good: 'Product Manager who grew DAU 12K → 180K at a Series B fintech',
                accent: '#F43F5E',
              },
              {
                title: 'The keyword dump',
                category: 'Skills section',
                person: { name: 'Vikram Mehta', role: 'Backend Engineer', loc: 'Pune', avatarSeed: 'vikram-mehta' },
                bad: 'Python | Java | AWS | Docker | SQL | Agile | Seeking opportunities',
                good: 'Backend Engineer · Reduced API latency 62% on a 3M-user SaaS platform',
                accent: '#F59E0B',
              },
              {
                title: 'The generic about',
                category: 'About section',
                person: { name: 'Anita Reddy', role: 'Engineering Lead', loc: 'Hyderabad', avatarSeed: 'anita-reddy' },
                bad: 'Hard-working individual with excellent communication and a can-do attitude.',
                good: 'Led 8-person engineering team shipping ₹4.2 Cr in revenue features. 3 promotions in 4 years.',
                accent: '#A855F7',
              },
            ].map((c, i) => (
              <div key={i} style={{
                position: 'relative',
                background: 'linear-gradient(180deg, #1A1A1F 0%, #131318 100%)',
                borderRadius: 20,
                padding: 18,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: '0 16px 40px -16px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
              }}>
                {/* Card label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', width: 24, height: 24, borderRadius: 6,
                      background: `${c.accent}1F`,
                      color: c.accent,
                      alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{c.title}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                    color: '#A1A1AA', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>{c.category}</span>
                </div>

                {/* BEFORE — realistic LinkedIn-style profile card */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '14px 14px 12px',
                  marginBottom: 10,
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                }}>
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    color: '#DC2626', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 999,
                    background: '#FEF2F2', border: '1px solid #FECACA',
                  }}>Before</span>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${c.person.avatarSeed}-bad&backgroundColor=e2e8f0,d1d5db,9ca3af`}
                        alt={c.person.name}
                        style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', filter: 'grayscale(0.5)' }}
                      />
                      {/* Open to Work ring */}
                      <span aria-hidden="true" style={{
                        position: 'absolute', inset: -2,
                        borderRadius: '50%',
                        boxShadow: 'inset 0 0 0 2px #16A34A',
                      }} />
                      <span style={{
                        position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                        background: '#16A34A', color: 'white',
                        fontSize: 7, fontWeight: 700, letterSpacing: '0.04em',
                        padding: '1px 6px', borderRadius: 999,
                        whiteSpace: 'nowrap',
                      }}>#OPENTOWORK</span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.2 }}>
                        {c.person.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#525252', marginTop: 2, lineHeight: 1.35, fontStyle: 'italic', textDecoration: 'line-through', textDecorationColor: '#DC2626', textDecorationThickness: 1 }}>
                        {c.bad}
                      </div>
                      <div style={{ fontSize: 10, color: '#737373', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{c.person.loc}</span>
                        <span style={{ color: '#D4D4D8' }}>·</span>
                        <span>500+ connections</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {['Generic', 'No metrics', 'No keywords'].map(t => (
                          <span key={t} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 9, fontWeight: 600,
                            padding: '2px 6px', borderRadius: 4,
                            color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA',
                          }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', margin: '6px 0' }}>
                  <span style={{ height: 1, width: 24, background: 'rgba(255, 255, 255, 0.1)' }} />
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: '#A5B4FC',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2v8" />
                      <path d="M16 6l-4 4-4-4" />
                    </svg>
                    AI Rewrite
                  </span>
                  <span style={{ height: 1, width: 24, background: 'rgba(255, 255, 255, 0.1)' }} />
                </div>

                {/* AFTER — realistic LinkedIn-style profile card */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '14px 14px 12px',
                  position: 'relative',
                  boxShadow: '0 4px 16px -4px rgba(79, 70, 229, 0.20), 0 1px 3px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(79, 70, 229, 0.18)',
                }}>
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    color: 'white', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 999,
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.35)',
                  }}>After</span>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${c.person.avatarSeed}-good&backgroundColor=c7d2fe,ddd6fe,fbcfe8`}
                        alt={c.person.name}
                        style={{ width: 44, height: 44, borderRadius: '50%', background: '#EEF2FF' }}
                      />
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 12, height: 12, borderRadius: '50%',
                        background: '#10B981', border: '2px solid white',
                      }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.2 }}>
                          {c.person.name}
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          fontSize: 9, fontWeight: 700,
                          color: '#4F46E5', padding: '1px 5px', borderRadius: 3,
                          background: '#EEF2FF',
                        }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1l2.5 5 5.5.8-4 3.9.9 5.5L12 13.5l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" /></svg>
                          PRO
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#0A0A0A', fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>
                        <span style={{ background: 'linear-gradient(120deg, rgba(79, 70, 229, 0.10) 0%, rgba(124, 58, 237, 0.08) 50%, rgba(219, 39, 119, 0.10) 100%)', padding: '0 2px', borderRadius: 2 }}>
                          {c.good}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#737373', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{c.person.loc}</span>
                        <span style={{ color: '#D4D4D8' }}>·</span>
                        <span>500+ connections</span>
                        <span style={{ color: '#D4D4D8' }}>·</span>
                        <span style={{ color: '#16A34A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
                          12 recruiter views today
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {['Quantified', 'ATS-ready', 'Recruiter-friendly'].map(t => (
                          <span key={t} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 9, fontWeight: 600,
                            padding: '2px 6px', borderRadius: 4,
                            color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0',
                          }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button type="button" onClick={scrollToHero} style={{ background: '#4F46E5', color: 'white', fontSize: 15, fontWeight: 600, padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(79, 70, 229,0.3)' }}>
              Find Out What&rsquo;s Wrong With Yours &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ── Everything You Need ── */}
      <section style={{
        padding: 'clamp(80px, 10vw, 120px) 0',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
        borderBottom: '1px solid rgba(10, 10, 10, 0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              color: '#3730A3', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(238, 242, 255, 0.8)', border: '1px solid rgba(79, 70, 229, 0.18)',
            }}>
              What you get
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800,
              color: '#0A0A0A', letterSpacing: '-0.035em',
              marginTop: 20, marginBottom: 16, lineHeight: 1.05,
            }}>
              Everything to land<br /><span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                color: 'transparent', WebkitTextFillColor: 'transparent',
              }}>your next interview</span>
            </h2>
            <p style={{ fontSize: 17, color: '#525252', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
              One ₹499 unlock — full LinkedIn rewrite, ATS resume in 11 templates, cover letter, and interview prep.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '20px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 10 }}>HEADLINE REWRITE</div>
                <div style={{ fontSize: 12, color: '#DC2626', textDecoration: 'line-through', marginBottom: 8, lineHeight: 1.5 }}>&ldquo;Results-driven professional seeking new opportunities&rdquo;</div>
                <div style={{ width: '100%', height: 1, background: '#E5E7EB', margin: '8px 0' }} />
                <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, lineHeight: 1.5 }}>
                  <span style={{ background: '#D1FAE5', padding: '2px 4px', borderRadius: 3 }}>&ldquo;Product Manager | Increased retention by 42% across 500K-user SaaS&rdquo;</span>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Profile Rewrite</div>
              <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>AI rewrites your headline, about, and experience with real metrics.</div>
            </div>
            <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '20px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 10 }}>SUMMARY COMPARISON</div>
                <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.6, marginBottom: 8 }}>
                  <span style={{ textDecoration: 'line-through' }}>Passionate professional with excellent communication skills and team spirit...</span>
                </div>
                <div style={{ width: '100%', height: 1, background: '#E5E7EB', margin: '8px 0' }} />
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>
                  <span style={{ background: '#D1FAE5', padding: '1px 3px', borderRadius: 2 }}>Led 8-person engineering team shipping &#8377;4.2Cr revenue features. Reduced API latency 40%.</span>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>ATS Resume Builder</div>
              <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>11 ATS templates. Your rewritten content. Instant PDF download.</div>
            </div>
            <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
              <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '20px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, marginBottom: 10 }}>KEYWORD OPTIMIZATION</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {['React', 'Node.js', 'AWS'].map(k => (
                    <span key={k} style={{ padding: '3px 8px', background: '#E2E8F0', color: '#64748B', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{k}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Microservices', 'CI/CD', 'Docker', 'Agile', 'PostgreSQL'].map(k => (
                    <span key={k} style={{ padding: '3px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 6, fontSize: 10, fontWeight: 600, border: '1px solid #BBF7D0' }}>+ {k}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#15803D', fontWeight: 600, marginTop: 8 }}>+5 missing keywords added</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Interview Prep Kit</div>
              <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>15 STAR-format questions, cheat sheet, and practice quiz.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{
        position: 'relative',
        padding: 'clamp(80px, 10vw, 120px) 0',
        background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
        borderBottom: '1px solid rgba(10, 10, 10, 0.06)',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: '40%', left: '-10%',
          width: 'min(50vw, 500px)', height: 500,
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 60%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              color: '#3730A3', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(238, 242, 255, 0.8)', border: '1px solid rgba(79, 70, 229, 0.18)',
            }}>
              How it works
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800,
              color: '#0A0A0A', letterSpacing: '-0.035em',
              marginTop: 20, marginBottom: 0, lineHeight: 1.05,
            }}>
              From upload to <span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                color: 'transparent', WebkitTextFillColor: 'transparent',
              }}>polished profile</span><br />in 90 seconds
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, maxWidth: 1080, margin: '0 auto' }}>
            {[
              { num: '01', icon: '📄', title: 'Upload Your Resume', desc: 'Resume PDF, LinkedIn PDF, or quick questionnaire.', preview: 'Drag & drop your file here' },
              { num: '02', icon: '🤖', title: 'AI Analyzes & Rewrites', desc: 'AI scores, identifies gaps, and rewrites everything.', preview: 'Analyzing 14 keywords...' },
              { num: '03', icon: '🚀', title: 'Download & Apply', desc: 'LinkedIn rewrite, ATS resume, cover letter, and interview prep.', preview: 'Resume ready for download' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 24, padding: 32, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 64, height: 64, background: '#EEF2FF', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#E2E8F0', marginBottom: 12 }}>{s.num}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, flex: 1, marginBottom: 20 }}>{s.desc}</div>
                <div style={{ height: 100, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{s.preview}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── See Real Results ── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="landing-section" style={{ maxWidth: 1000 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="saas-eyebrow" style={{ marginBottom: 8 }}>Real output</div>
            <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>See what ProfileRoaster generates</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 32, maxWidth: 800, margin: '0 auto 32px', alignItems: 'stretch' }}>
            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '24px', border: '1px solid #FECACA' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', letterSpacing: 1, marginBottom: 10 }}>BEFORE &mdash; Score: 38</div>
              <div style={{ fontSize: 14, color: '#991B1B', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;Software Engineer | Python | Java | AWS | Docker | Seeking opportunities&rdquo;</div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#DC2626' }}>
                <div>&#10007; Generic headline</div>
                <div>&#10007; No measurable impact</div>
                <div>&#10007; Missing 12 ATS keywords</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#94A3B8' }}>&rarr;</span>
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '24px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#057642', letterSpacing: 1, marginBottom: 10 }}>AFTER &mdash; Score: 84</div>
              <div style={{ fontSize: 14, color: '#057642', lineHeight: 1.6, fontWeight: 600 }}>&ldquo;Full-Stack Engineer | Built 5 Apps Serving 50K+ Users | React + AWS + Node.js&rdquo;</div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#057642' }}>
                <div>&#10003; Achievement-focused headline</div>
                <div>&#10003; Quantified impact (50K+ users)</div>
                <div>&#10003; All ATS keywords present</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', background: 'white' }}>
              <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--accent)' }}>&#9997;&#65039; Profile Rewrite</div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Before</div>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                    &ldquo;Senior Manager | B2B Sales | Looking for new opportunities&rdquo;
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>After</div>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                    &ldquo;B2B Sales Leader | &#8377;12Cr Pipeline | SaaS &amp; Enterprise | 6 Years Scaling Revenue for Series B-D Startups&rdquo;
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textAlign: 'center', marginTop: 12 }}>
                  Headline + About + Experience bullets rewritten
                </div>
              </div>
            </div>
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', background: 'white' }}>
              <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--accent)' }}>&#128196; ATS Resume (11 templates)</div>
              <div style={{ padding: 0 }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', margin: 12, borderRadius: 4, padding: 14, fontSize: 11 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Priya Mehta</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Product Manager | 5 years | Fintech &amp; SaaS</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Experience</div>
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4 }} />
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4, width: '60%' }} />
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Skills</div>
                  <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, width: '100%' }} />
                </div>
                <div style={{ margin: '0 12px 12px', fontSize: 12, color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                  ATS-optimized, ready to download as PDF
                </div>
              </div>
            </div>
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', background: 'white' }}>
              <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, var(--success), #034A2A)' }}>&#127919; Interview Prep Kit</div>
              <div style={{ padding: '14px 16px' }}>
                {[
                  { type: 'Behavioral', q: 'Tell me about a time you handled a difficult stakeholder.' },
                  { type: 'Technical', q: 'How would you prioritize features for a new product launch?' },
                  { type: 'Situational', q: 'Your team missed a deadline. What do you do?' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 8, fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>{item.type}</div>
                    {item.q}
                  </div>
                ))}
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textAlign: 'center', marginTop: 8 }}>
                  15 questions + STAR answers + cheat sheet
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: 'clamp(60px, 10vw, 120px) 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="landing-section" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: 40, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
          </div>
          {[
            { q: 'Is the profile score really free?', a: 'Yes! Upload your resume or LinkedIn PDF and get an instant AI score with a suggested headline — completely free, no signup required.' },
            { q: 'What do I get with the paid plan?', a: 'A complete profile rewrite (headline, about, experience), ATS-optimized resume in multiple templates, personalized cover letter, and interview prep with questions, STAR-format answers, cheat sheet, and quiz.' },
            { q: 'Can I upload my resume instead of LinkedIn PDF?', a: 'Yes! You can upload your resume (PDF or DOCX) and we will analyze it, improve it, AND generate LinkedIn content from it.' },
            { q: 'How is this different from ChatGPT?', a: 'ProfileRoaster is purpose-built for LinkedIn optimization. It understands ATS algorithms, recruiter behavior, and Indian job market nuances. You get structured, ready-to-use output — not generic paragraphs.' },
            { q: 'How long does it take?', a: 'The free score is instant. The full rewrite + resume + interview prep is generated in about 90 seconds after payment.' },
            { q: 'Is my data safe?', a: 'Your data is encrypted in transit and at rest. Only AI processes your profile — no humans read it. You can delete your data anytime from your dashboard.' },
            { q: 'What payment methods do you accept?', a: "We accept UPI, credit/debit cards, net banking, and wallets via Razorpay — India's most trusted payment gateway." },
            { q: 'Can I get a refund?', a: 'We offer refunds within 7 days for quality issues. See our refund policy.' },
          ].map((item, i) => (
            <div key={i} style={{ borderRadius: 18, border: '1px solid #E5E7EB', background: 'white', marginBottom: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', paddingRight: 16 }}>{item.q}</span>
                <span style={{ fontSize: 20, color: '#94A3B8', flexShrink: 0, transition: 'transform 0.2s', transform: faqOpen === i ? 'rotate(45deg)' : 'none', fontWeight: 300, lineHeight: 1 }}>+</span>
              </button>
              <div style={{ overflow: 'hidden', maxHeight: faqOpen === i ? 200 : 0, transition: 'max-height 0.3s ease' }}>
                <div style={{ padding: '0 20px 18px', fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: 'clamp(60px, 10vw, 120px) 0', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Testimonials</div>
            <h2 style={{ fontSize: 40, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>What Our Users Say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {[
              { name: 'Rahul Verma', role: 'Software Engineer, Bangalore', quote: 'I rewrote my headline and got 3 recruiter messages in the same week. Score went from 34 to 82.', stars: 5 },
              { name: 'Sneha Iyer', role: 'MBA Graduate, Mumbai', quote: 'The interview prep was incredibly specific. I used the STAR answers in my Amazon interview and cleared it.', stars: 5 },
              { name: 'Arjun Patel', role: 'Product Manager, Pune', quote: 'Spent ₹499 instead of ₹8000 on a resume writer. Got a better result in 90 seconds.', stars: 5 },
            ].map((t, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <span key={si} style={{ color: '#FBBF24', fontSize: 18 }}>&#9733;</span>
                  ))}
                </div>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(t.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: '#F1F5F9' }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section style={{ padding: '80px 0', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Why ProfileRoaster</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Compare your options</h2>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid rgba(15,23,42,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Feature</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid #E5E7EB', background: '#EEF2FF' }}>ProfileRoaster</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>ChatGPT</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Resume Writer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'ATS-optimized resume', us: '✓', gpt: '~', writer: '~' },
                  { feature: 'LinkedIn profile rewrite', us: '✓', gpt: '~', writer: '✗' },
                  { feature: 'Interview prep (15 Qs)', us: '✓', gpt: '✗', writer: '✗' },
                  { feature: 'ATS score analysis', us: '✓', gpt: '✗', writer: '✗' },
                  { feature: 'Cover letter', us: '✓', gpt: '~', writer: '✓' },
                  { feature: 'Ready in minutes', us: '90 sec', gpt: '30+ min', writer: '3-7 days' },
                  { feature: 'Price', us: '₹499', gpt: '₹1700/mo', writer: '₹3000-15000' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < 6 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '12px 20px', color: '#374151' }}>{row.feature}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 600, color: '#057642', background: '#FAFFFE' }}>{row.us}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', color: row.gpt === '✗' ? '#DC2626' : '#6B7280' }}>{row.gpt}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', color: row.writer === '✗' ? '#DC2626' : '#6B7280' }}>{row.writer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: 'clamp(80px, 10vw, 140px) 0', background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #18181B 0%, #0A0A0A 100%)',
            borderRadius: 32,
            padding: 'clamp(56px, 8vw, 96px) clamp(24px, 5vw, 64px)',
            textAlign: 'center',
            boxShadow: '0 30px 80px -20px rgba(79, 70, 229, 0.30), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
            overflow: 'hidden',
          }}>
            {/* Mesh gradient overlay */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              background:
                'radial-gradient(at 20% 0%, rgba(124, 58, 237, 0.30) 0%, transparent 50%), ' +
                'radial-gradient(at 80% 100%, rgba(219, 39, 119, 0.22) 0%, transparent 50%), ' +
                'radial-gradient(at 50% 50%, rgba(79, 70, 229, 0.18) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                color: '#C4B5FD', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.30)',
                marginBottom: 24,
              }}>
                Free • No signup • 90 seconds
              </div>
              <h2 style={{
                fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800,
                color: 'white', marginBottom: 20, letterSpacing: '-0.04em',
                lineHeight: 1.05,
              }}>
                Ready to stop<br /><span style={{
                  background: 'linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 50%, #F9A8D4 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  color: 'transparent', WebkitTextFillColor: 'transparent',
                }}>getting ghosted?</span>
              </h2>
              <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255, 255, 255, 0.75)', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.6 }}>
                Upload your resume, get an AI score for free. Decide later if the rewrite is worth ₹499.
              </p>
              <button
                type="button"
                onClick={scrollToHero}
                style={{
                  height: 60, padding: '0 36px',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)',
                  color: '#0A0A0A', fontSize: 16, fontWeight: 700,
                  borderRadius: 14, border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'; }}
              >
                Get my free score &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
