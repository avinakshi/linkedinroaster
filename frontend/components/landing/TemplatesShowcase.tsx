'use client';

import { useState, useRef, useEffect } from 'react';
import { TEMPLATES, renderResumeHTML } from '../resume/ResumeTemplates';

// ─── Sample resume used to preview templates on the homepage ───
const SAMPLE_RESUME = {
  contact: { name: 'Ananya Sharma', email: 'ananya.sharma@gmail.com', phone: '98765-43210', location: 'Mumbai, India', linkedin: 'linkedin.com/in/ananya-sharma', website: 'ananyasharma.com' },
  summary: '7+ years of product management experience driving customer growth and engagement across fintech, e-commerce, and SaaS platforms. Increased monthly active users by 35%, revenue by ₹4.2 Cr, and customer retention by 28%. Led cross-functional teams of 15+ members to deliver products serving 2M+ users. Proven track record in data-driven decision making, agile methodologies, and stakeholder management across B2B and B2C products.',
  experience: [
    { role: 'Senior Product Manager', company: 'Razorpay', location: 'Bangalore, India', dates: 'Jan 2022 - Present', bullets: [
      'Led product strategy for merchant onboarding platform, increasing conversion rate by 32% and reducing drop-off by 45% through data-driven UX improvements across web and mobile touchpoints.',
      'Managed cross-functional team of 12 engineers, 3 designers, and 2 analysts to deliver payment gateway features processing ₹500 Cr+ monthly transactions with 99.98% uptime SLA.',
      'Spearheaded launch of instant settlement feature for 50K+ merchants, driving ₹1.8 Cr incremental monthly revenue and reducing merchant churn by 18% within the first quarter.',
      'Conducted 200+ customer interviews and analyzed behavioral data of 2M+ users to identify key pain points, resulting in a product roadmap that improved NPS from 42 to 67.',
    ] },
    { role: 'Product Manager', company: 'Flipkart', location: 'Bangalore, India', dates: 'Mar 2019 - Dec 2021', bullets: [
      'Owned the seller analytics dashboard serving 150K+ sellers, implementing real-time insights that improved seller GMV by 22% and reduced support tickets by 35% through proactive alerts.',
      'Drove the launch of Flipkart Quick (90-minute delivery) in 8 cities, coordinating logistics, warehouse, and engineering teams. Achieved 4.5-star rating and 40% repeat order rate within 6 months.',
      'Redesigned checkout flow using A/B testing framework, reducing cart abandonment by 19% and increasing average order value by ₹240, translating to ₹12 Cr additional quarterly revenue.',
    ] },
    { role: 'Associate Product Manager', company: 'Freshworks', location: 'Chennai, India', dates: 'Jul 2017 - Feb 2019', bullets: [
      'Built and launched the Freshdesk AI chatbot module from 0 to 1, achieving 60% ticket deflection rate for enterprise clients and winning internal innovation award for best product launch of 2018.',
      'Defined pricing tiers for new product line with sales and CS teams, contributing to ₹3.5 Cr ARR within the first year across 200+ enterprise accounts.',
      'Implemented product analytics tracking using Mixpanel and Amplitude, reducing feature development cycle time by 25% through evidence-based prioritization.',
    ] },
    { role: 'Product Analyst Intern', company: 'Paytm', location: 'Noida, India', dates: 'Jan 2017 - Jun 2017', bullets: [
      'Analyzed user behavior patterns across 5M+ monthly transactions to identify conversion bottlenecks in the merchant payment flow, presenting findings to VP Product.',
      'Created weekly product dashboards using SQL and Tableau, tracking 15 KPIs that informed feature prioritization decisions for the payments team.',
    ] },
  ],
  education: [
    { degree: 'MBA Product Management', institution: 'IIM Bangalore', year: '2017', gpa: '8.4/10' },
    { degree: 'B.Tech Computer Science', institution: 'NIT Trichy', year: '2015', gpa: '8.9/10' },
  ],
  skills: {
    technical: ['SQL', 'Python', 'Jira', 'Confluence', 'Figma', 'Google Analytics', 'Mixpanel', 'Amplitude', 'Tableau', 'API Design'],
    soft: ['Product Strategy', 'Agile/Scrum', 'A/B Testing', 'User Research', 'Stakeholder Management', 'Go-to-Market Strategy', 'PRDs & Roadmaps', 'Cross-functional Leadership'],
  },
  achievements: ['Razorpay Star Performer Award 2023', 'Published in YourStory — "Building for Bharat"', 'ISB Product Leadership Fellowship 2022', 'Mentor at ProductFolks Community (500+ mentees)', 'Google Analytics Certified Professional'],
};

// ─── ScaledResume — fixed-height resume preview that scales the 794px-wide design to fit ───
function ScaledResume({ templateId, data, previewHeight = 400 }: { templateId: string; data: any; previewHeight?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.39);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      if (w > 0) setZoom(w / 794);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} style={{
      background: '#FFFFFF',
      borderRadius: 4,
      overflow: 'hidden',
      height: previewHeight,
    }}>
      <div style={{ width: 794, zoom, pointerEvents: 'none' }}>
        {renderResumeHTML(data, templateId)}
      </div>
    </div>
  );
}

// ─── Templates + Cover Letters showcase (dark "callbacks" gallery) ───
export default function TemplatesShowcase() {
  const [showcaseTab, setShowcaseTab] = useState<'resumes' | 'coverletters'>('resumes');
  const [carouselPage, setCarouselPage] = useState(0);

  return (
    <section id="templates" style={{
      position: 'relative',
      background: 'linear-gradient(180deg, #0A0A0A 0%, #18181B 100%)',
      padding: 'clamp(72px, 8vw, 112px) 0',
      overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.6), rgba(219, 39, 119, 0.6), transparent)',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(90vw, 1100px)', height: 600,
        background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.18) 0%, rgba(219, 39, 119, 0.06) 35%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 64px)' }}>
        <div style={{
          display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
          color: '#A5B4FC', textTransform: 'uppercase',
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)',
        }}>11 premium templates</div>
        <h2 style={{
          fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800,
          color: 'white', letterSpacing: '-0.035em',
          marginTop: 20, marginBottom: 8, lineHeight: 1.05,
        }}>
          Templates that <span style={{
            background: 'linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 50%, #F9A8D4 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', WebkitTextFillColor: 'transparent',
          }}>actually get callbacks</span>
        </h2>
        <p style={{ fontSize: 16, color: '#A1A1AA', maxWidth: 540, margin: '12px auto 0', lineHeight: 1.6 }}>
          ATS-optimized layouts engineered for Indian recruiters. Pick one, get your rewrite, download as PDF.
        </p>
      </div>
      {/* Tabs */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 'clamp(32px, 5vw, 48px)' }}>
        <div style={{
          display: 'inline-flex', gap: 4, padding: 4,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          {(['resumes', 'coverletters'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => { setShowcaseTab(tab); setCarouselPage(0); }} style={{
              fontSize: 14, fontWeight: 600,
              color: showcaseTab === tab ? '#0A0A0A' : '#D4D4D8',
              background: showcaseTab === tab ? 'white' : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: 10,
              fontFamily: 'inherit',
              boxShadow: showcaseTab === tab ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}>
              {tab === 'resumes' ? 'Resumes' : 'Cover Letters'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resumes tab content ── */}
      {showcaseTab === 'resumes' && (
        <>
          {/* Desktop: 3-up cards with labels + hover preview overlay */}
          <div className="hidden md:block">
            <div style={{ position: 'relative', overflow: 'hidden', maxWidth: 1300, margin: '0 auto', padding: '0 32px' }}>
              <div style={{ display: 'flex', transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${carouselPage * 100}%)` }}>
                {Array.from({ length: Math.ceil(TEMPLATES.length / 3) }).map((_, pageIdx) => (
                  <div key={pageIdx} style={{ display: 'flex', gap: 24, minWidth: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                    {TEMPLATES.slice(pageIdx * 3, pageIdx * 3 + 3).map((t, i) => {
                      const paperBgs = ['#F4E9D2', '#FFFFFF', '#EAEAEA', '#D5E2F0', '#F4E9D2', '#D4EAD6', '#E5DAEC', '#F4E5D2', '#D2E8E8', '#F0D2DC', '#DEE2E6'];
                      const globalIdx = pageIdx * 3 + i;
                      const isPopular = t.id === 'modern';
                      return (
                        <a
                          key={t.id}
                          href="/templates"
                          className="pr-tpl-card"
                          style={{
                            position: 'relative',
                            flex: '1 1 0',
                            maxWidth: 380,
                            background: '#161618',
                            borderRadius: 18,
                            padding: 12,
                            cursor: 'pointer',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 12px 36px -16px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s, border-color 0.25s',
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'block',
                          }}
                        >
                          {isPopular && (
                            <div style={{
                              position: 'absolute', top: 18, right: 18, zIndex: 3,
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                              color: 'white', textTransform: 'uppercase',
                              padding: '5px 10px', borderRadius: 999,
                              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.45)',
                            }}>Most popular</div>
                          )}
                          <div style={{
                            background: paperBgs[globalIdx % paperBgs.length],
                            borderRadius: 12,
                            padding: '14px 12px 12px',
                            position: 'relative',
                            overflow: 'hidden',
                          }}>
                            <ScaledResume templateId={t.id} data={SAMPLE_RESUME} previewHeight={400} />
                            <div className="pr-tpl-overlay" style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(10, 10, 10, 0.55)',
                              backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
                              opacity: 0,
                              transition: 'opacity 0.25s',
                              pointerEvents: 'none',
                            }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '11px 22px', borderRadius: 999,
                                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                                color: 'white', fontSize: 13, fontWeight: 700,
                                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                                letterSpacing: '-0.005em',
                              }}>
                                Use this template
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                              </span>
                            </div>
                          </div>
                          <div style={{ padding: '14px 6px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.015em', marginBottom: 4 }}>
                                {t.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#A1A1AA', lineHeight: 1.4 }}>
                                Best for {(t.bestFor || []).slice(0, 2).join(', ')}
                              </div>
                            </div>
                            <div style={{
                              flexShrink: 0,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                              color: '#A5B4FC', textTransform: 'uppercase',
                              padding: '4px 8px', borderRadius: 6,
                              background: 'rgba(99, 102, 241, 0.12)',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              ATS
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {/* Pagination dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 36 }}>
              {Array.from({ length: Math.ceil(TEMPLATES.length / 3) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCarouselPage(i)}
                  aria-label={`Page ${i + 1}`}
                  style={{
                    width: carouselPage === i ? 28 : 10,
                    height: 10,
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    background: carouselPage === i
                      ? 'linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 50%, #F9A8D4 100%)'
                      : 'rgba(255, 255, 255, 0.25)',
                    boxShadow: carouselPage === i ? '0 0 12px rgba(165, 180, 252, 0.5)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              ))}
            </div>
            {/* View all link */}
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <a href="/templates" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600,
                color: '#D4D4D8', textDecoration: 'none',
                padding: '10px 20px', borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                transition: 'all 0.18s',
              }}>
                Browse all 11 templates
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile: horizontal swipe */}
          <div className="md:hidden" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 24px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {TEMPLATES.slice(0, 6).map((t, i) => {
              const paperBgs = ['#F4E9D2', '#FFFFFF', '#EAEAEA', '#D5E2F0', '#F4E9D2', '#D4EAD6'];
              const isPopular = t.id === 'modern';
              return (
                <a
                  key={t.id}
                  href="/templates"
                  style={{
                    position: 'relative',
                    flex: '0 0 240px', scrollSnapAlign: 'center',
                    background: '#161618',
                    borderRadius: 14, padding: 10,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.18)',
                    textDecoration: 'none', color: 'inherit', display: 'block',
                  }}
                >
                  {isPopular && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14, zIndex: 3,
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      color: 'white', textTransform: 'uppercase',
                      padding: '4px 8px', borderRadius: 999,
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                    }}>Popular</div>
                  )}
                  <div style={{
                    background: paperBgs[i],
                    borderRadius: 10, padding: '10px 8px 8px',
                  }}>
                    <ScaledResume templateId={t.id} data={SAMPLE_RESUME} previewHeight={300} />
                  </div>
                  <div style={{ padding: '12px 4px 2px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#A1A1AA', lineHeight: 1.4 }}>
                      Best for {(t.bestFor || []).slice(0, 2).join(', ')}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}

      {/* ── Cover Letters tab content ── */}
      {showcaseTab === 'coverletters' && (
        <>
          <div className="hidden md:block" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              {[
                { name: 'Professional', tag: 'Best for corporate, finance, law', font: "'Inter', sans-serif", paperBg: '#F4E9D2', accent: '#B8860B' },
                { name: 'Modern', tag: 'Best for tech, startups, product roles', font: "'Inter', sans-serif", paperBg: '#FFFFFF', accent: '#DB2777', popular: true },
                { name: 'Minimal', tag: 'Best for consulting, design, premium feel', font: 'Georgia, serif', paperBg: '#EAEAEA', accent: '#0A0A0A' },
              ].map((s) => (
                <a key={s.name} href="/templates" className="pr-tpl-card" style={{
                  position: 'relative',
                  flex: '1 1 0', maxWidth: 340,
                  background: '#161618', borderRadius: 18, padding: 12,
                  cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 12px 36px -16px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.2)',
                  overflow: 'hidden',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s, border-color 0.25s',
                }}>
                  {s.popular && (
                    <div style={{
                      position: 'absolute', top: 18, right: 18, zIndex: 3,
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      color: 'white', textTransform: 'uppercase',
                      padding: '5px 10px', borderRadius: 999,
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.45)',
                    }}>Most popular</div>
                  )}
                  <div style={{
                    background: s.paperBg, borderRadius: 12,
                    padding: '14px 12px 12px',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      background: 'white', borderRadius: 8,
                      padding: '20px 22px', fontFamily: s.font,
                      fontSize: 11, lineHeight: 1.65, color: '#374151',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      height: 360, overflow: 'hidden',
                    }}>
                      {s.name === 'Modern' && <div style={{ height: 2.5, width: 32, background: s.accent, marginBottom: 14, borderRadius: 2 }} />}
                      <div style={{ fontSize: s.name === 'Professional' ? 18 : 15, fontWeight: 700, color: s.accent, marginBottom: 14 }}>Ananya Sharma</div>
                      <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 12 }}>Mumbai &bull; ananya.sharma@gmail.com</div>
                      <p style={{ margin: '0 0 10px' }}>Dear Hiring Manager,</p>
                      <p style={{ margin: '0 0 10px' }}>I&rsquo;m writing about the Senior PM role. 7 years across Razorpay, Flipkart, Freshworks &mdash; building products that drive measurable impact.</p>
                      <p style={{ margin: '0 0 10px' }}>At Razorpay I lead merchant onboarding: <strong style={{ color: '#0A0A0A' }}>+32% conversion</strong>, <strong style={{ color: '#0A0A0A' }}>&#8377;1.8 Cr monthly revenue</strong>, 17-person team.</p>
                      <p style={{ margin: '0 0 4px', color: '#6B7280' }}>Warm regards,</p>
                      <p style={{ margin: 0, fontWeight: 700, color: '#0A0A0A', fontSize: 12 }}>Ananya Sharma</p>
                    </div>
                    <div className="pr-tpl-overlay" style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(10, 10, 10, 0.55)',
                      backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
                      opacity: 0, transition: 'opacity 0.25s', pointerEvents: 'none',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 22px', borderRadius: 999,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                        color: 'white', fontSize: 13, fontWeight: 700,
                        boxShadow: '0 8px 20px rgba(79, 70, 229, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                      }}>
                        Use this style
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 6px 4px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.015em', marginBottom: 4 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#A1A1AA', lineHeight: 1.4 }}>{s.tag}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile cover letters */}
          <div className="md:hidden" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 24px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {[
              { name: 'Professional', tag: 'Corporate roles', font: "'Inter', sans-serif", paperBg: '#F4E9D2', accent: '#B8860B' },
              { name: 'Modern', tag: 'Tech & startups', font: "'Inter', sans-serif", paperBg: '#FFFFFF', accent: '#DB2777', popular: true },
              { name: 'Minimal', tag: 'Consulting, design', font: 'Georgia, serif', paperBg: '#EAEAEA', accent: '#0A0A0A' },
            ].map((s) => (
              <a key={s.name} href="/templates" style={{
                position: 'relative',
                flex: '0 0 240px', scrollSnapAlign: 'center',
                background: '#161618', borderRadius: 14, padding: 10,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.18)',
                textDecoration: 'none', color: 'inherit', display: 'block',
              }}>
                {s.popular && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14, zIndex: 3,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                    color: 'white', textTransform: 'uppercase',
                    padding: '4px 8px', borderRadius: 999,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
                  }}>Popular</div>
                )}
                <div style={{
                  background: s.paperBg, borderRadius: 10, padding: '10px 8px 8px',
                }}>
                  <div style={{
                    background: 'white', borderRadius: 8,
                    padding: '14px 14px', fontFamily: s.font,
                    fontSize: 10, lineHeight: 1.6, color: '#374151',
                    height: 260, overflow: 'hidden',
                  }}>
                    {s.name === 'Modern' && <div style={{ height: 2, width: 24, background: s.accent, marginBottom: 12, borderRadius: 2 }} />}
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginBottom: 10 }}>Ananya Sharma</div>
                    <p style={{ margin: '0 0 8px' }}>Dear Hiring Manager,</p>
                    <p style={{ margin: '0 0 8px' }}>Senior PM role, 7 years across Razorpay, Flipkart, Freshworks.</p>
                    <p style={{ margin: '0 0 8px' }}>At Razorpay: <strong>+32% conversion</strong>.</p>
                    <p style={{ margin: '0 0 4px', color: '#6B7280' }}>Warm regards,</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>Ananya Sharma</p>
                  </div>
                </div>
                <div style={{ padding: '12px 4px 2px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#A1A1AA' }}>{s.tag}</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
