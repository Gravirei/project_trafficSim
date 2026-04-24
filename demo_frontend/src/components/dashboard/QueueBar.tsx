export default function QueueBar({ length, max = 20 }: { length: number, max?: number }) {
  const percentage = Math.min((length / max) * 100, 100);
  
  // Color transitions based on queue length
  let color = 'var(--accent-green)';
  if (percentage > 50) color = 'var(--accent-yellow)';
  if (percentage > 85) color = 'var(--accent-red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span className="metrics-label" style={{ color: "var(--text-primary)" }}>Active Queue</span>
        <span className="metrics-value">{length}</span>
      </div>
      
      <div style={{
        height: '8px',
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
          boxShadow: `0 0 10px ${color}80`
        }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>0</span>
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
