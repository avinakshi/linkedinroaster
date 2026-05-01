'use client';

/**
 * Top-level error boundary — only fires when even the root layout fails.
 * Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#FAFAFA',
        color: '#0A0A0A',
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: 440, width: '100%',
          background: 'white',
          borderRadius: 20,
          border: '1px solid rgba(10, 10, 10, 0.06)',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(10, 10, 10, 0.04)',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.025em' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#525252', lineHeight: 1.6, marginBottom: 24 }}>
            The page failed to load. Please try again — and if this keeps happening, drop us a line at{' '}
            <a href="mailto:support@profileroaster.in" style={{ color: '#4F46E5', textDecoration: 'underline' }}>support@profileroaster.in</a>.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '11px 22px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          {error.digest && (
            <div style={{ fontSize: 11, color: '#A3A3A3', marginTop: 20, fontFamily: 'monospace' }}>
              Error ID: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
