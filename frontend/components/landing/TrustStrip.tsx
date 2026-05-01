/**
 * Trust strip — premium glass stat cards + plain-text company list.
 * Pure presentation; no client state or props. Server-renderable.
 */
const STATS = [
  { value: '2,400+', label: 'Resumes analyzed', accent: false, hint: 'across India' },
  { value: '+45', label: 'Avg score lift', suffix: 'pts', accent: true, hint: '38 → 83 typical' },
  { value: '90s', label: 'Median delivery', accent: false, hint: 'including AI rewrite' },
  { value: '4.9/5', label: 'User rating', accent: false, hint: 'from 380+ reviews' },
] as const;

const COMPANIES = ['Google', 'Amazon', 'TCS', 'Infosys', 'Deloitte', 'Wipro', 'Razorpay', 'Flipkart'] as const;

export default function TrustStrip() {
  return (
    <section style={{
      position: 'relative',
      padding: '88px 0 80px',
      background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
      borderTop: '1px solid rgba(10, 10, 10, 0.06)',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(80vw, 900px)', height: 400,
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
            color: 'var(--accent-deep)', textTransform: 'uppercase',
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(238, 242, 255, 0.8)', border: '1px solid rgba(79, 70, 229, 0.15)',
          }}>Real numbers</div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em',
            marginTop: 16, marginBottom: 0, lineHeight: 1.1,
          }}>
            Built on <span style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              color: 'transparent', WebkitTextFillColor: 'transparent',
            }}>2,400+</span> real outcomes
          </h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(10, 10, 10, 0.06)',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: '0 1px 2px rgba(10, 10, 10, 0.03), 0 12px 32px -12px rgba(79, 70, 229, 0.10)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <div style={{
                fontSize: 'clamp(34px, 4.5vw, 48px)', fontWeight: 800,
                letterSpacing: '-0.035em', lineHeight: 1,
                color: stat.accent ? 'transparent' : 'var(--text-primary)',
                backgroundImage: stat.accent ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)' : 'none',
                WebkitBackgroundClip: stat.accent ? 'text' : 'unset',
                backgroundClip: stat.accent ? 'text' : 'unset',
                WebkitTextFillColor: stat.accent ? 'transparent' : 'inherit',
              }}>
                {stat.value}
                {'suffix' in stat && stat.suffix && <span style={{
                  fontSize: '0.42em', fontWeight: 600, marginLeft: 4,
                  color: 'var(--text-muted)',
                  background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'var(--text-muted)',
                }}>{stat.suffix}</span>}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 10, fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.hint}</div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 48, paddingTop: 32,
          borderTop: '1px solid rgba(10, 10, 10, 0.05)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Used by professionals from
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: '20px 36px',
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            color: 'var(--text-secondary)',
            opacity: 0.85,
          }}>
            {COMPANIES.map(name => (
              <span key={name} style={{ filter: 'grayscale(0.4)' }}>{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
