

interface Props {
  seconds: number;
  total: number;
  started: boolean;
}

export default function CountdownTimer({ seconds, total, started }: Props) {
  const pct = (seconds / total) * 100;
  const warning = seconds < 10;
  const colour = warning ? '#ef4444' : '#3b82f6';

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 800,
        textAlign: 'center',
        color: warning ? '#ef4444' : '#1e293b',
        transition: 'color 0.3s',
        lineHeight: 1,
        marginBottom: '0.5rem',
      }}>
        {started ? seconds : total}
      </div>
      <div style={{
        height: '14px',
        background: '#e2e8f0',
        borderRadius: '99px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: colour,
          borderRadius: '99px',
          transition: 'width 1s linear, background 0.3s',
        }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '0.3rem' }}>
        seconds remaining
      </div>
    </div>
  );
}
