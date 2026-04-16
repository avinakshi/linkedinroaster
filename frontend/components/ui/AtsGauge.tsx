'use client';

export default function AtsGauge({ score, size = 100 }: { score: number; size?: number }) {
  const radius = size * 0.38;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--accent)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

  return (
    <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
      <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-default)" strokeWidth={size * 0.08} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={size / 2} y={size * 0.45} textAnchor="middle" fontSize={size * 0.22} fontWeight={800} fill={color} dominantBaseline="middle" fontFamily="Inter, sans-serif">
          {score}
        </text>
        <text x={size / 2} y={size * 0.65} textAnchor="middle" fontSize={size * 0.1} fill="var(--text-muted)" fontWeight={600} fontFamily="Inter, sans-serif">
          ATS
        </text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
    </div>
  );
}
