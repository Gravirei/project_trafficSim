export default function SignalLight({ state, timeRemaining }: { state: 'GREEN' | 'YELLOW' | 'RED', timeRemaining: number }) {
  const getColors = (lightState: 'GREEN' | 'YELLOW' | 'RED') => {
    const isActive = state === lightState;
    if (lightState === 'RED') {
      return { bg: isActive ? 'var(--accent-red)' : '#3f1111', shadow: isActive ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'none' };
    }
    if (lightState === 'YELLOW') {
      return { bg: isActive ? 'var(--accent-yellow)' : '#3f2a11', shadow: isActive ? '0 0 20px rgba(245, 158, 11, 0.6)' : 'none' };
    }
    return { bg: isActive ? 'var(--accent-green)' : '#113f28', shadow: isActive ? '0 0 20px rgba(16, 185, 129, 0.6)' : 'none' };
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: 'rgba(0,0,0,0.5)',
      padding: '0.5rem 1rem',
      borderRadius: '2rem',
      border: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          backgroundColor: getColors('RED').bg,
          boxShadow: getColors('RED').shadow,
          transition: 'all 0.3s ease'
        }} />
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          backgroundColor: getColors('YELLOW').bg,
          boxShadow: getColors('YELLOW').shadow,
          transition: 'all 0.3s ease'
        }} />
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          backgroundColor: getColors('GREEN').bg,
          boxShadow: getColors('GREEN').shadow,
          transition: 'all 0.3s ease'
        }} />
      </div>

      <div style={{
        fontFamily: 'var(--font-fira-code)',
        fontWeight: 600,
        fontSize: '1.25rem',
        color: state === 'RED' ? 'var(--accent-red)' : state === 'YELLOW' ? 'var(--accent-yellow)' : 'var(--accent-green)',
        width: '2rem',
        textAlign: 'center'
      }}>
        {timeRemaining}
      </div>
    </div>
  );
}
