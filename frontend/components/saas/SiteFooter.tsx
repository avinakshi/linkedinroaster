'use client';

export default function SiteFooter({ variant = 'light' }: { variant?: 'dark' | 'light' }) {
  if (variant === 'dark') {
    return (
      <footer className="pr-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div className="pr-footer__logo"><span>Profile</span>Roaster</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>AI-powered career tools for Indian professionals</div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Pricing', href: '/pricing' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Refund', href: '/refund' },
            ].map((l, i) => (
              <a key={i} href={l.href}>{l.label}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>&copy; 2026 ProfileRoaster. All rights reserved.</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer-saas">
      <div className="site-footer-saas-inner">
        <div className="site-footer-saas-links">
          <a href="/terms">Terms &amp; Conditions</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/refund">Refund Policy</a>
          <span>Contact: support@profileroaster.in</span>
        </div>
        <p className="site-footer-saas-copy">
          &copy; 2026 Profile Roaster. Not affiliated with LinkedIn Corporation.
        </p>
      </div>
    </footer>
  );
}
