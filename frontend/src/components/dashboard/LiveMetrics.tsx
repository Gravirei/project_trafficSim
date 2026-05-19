export default function LiveMetrics({ lambda, rho, lq, wq }: { lambda: number, rho: number, lq: number, wq: number }) {
  const stats = [
    { label: 'Arrival Rate (λ)', value: lambda.toFixed(2), unit: 'veh/s' },
    { label: 'Utilization (ρ)', value: rho.toFixed(1), unit: '%' },
    { label: 'Avg Queue (Lq)', value: lq.toFixed(1), unit: 'veh' },
    { label: 'Avg Wait (Wq)', value: wq.toFixed(1), unit: 'sec' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      background: 'rgba(255,255,255,0.02)',
      padding: '1rem',
      borderRadius: '8px'
    }}>
      {stats.map(s => (
        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="metrics-label" style={{ fontSize: '0.7rem' }}>{s.label}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="metrics-value" style={{ fontSize: '1.25rem' }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
