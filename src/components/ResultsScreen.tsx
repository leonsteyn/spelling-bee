

export interface WordResult {
  word: string;
  typed: string;
  correct: boolean;
  timeTaken: number;
  points: number;
}

interface Props {
  results: WordResult[];
  totalElapsed: number;
  onHome: () => void;
  onRetry: () => void;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ResultsScreen({ results, totalElapsed, onHome, onRetry }: Props) {
  const totalScore = results.reduce((s, r) => s + r.points, 0);
  const maxScore = results.length * 25;
  const correct = results.filter(r => r.correct).length;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3.5rem' }}>🏆</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', margin: '0.25rem 0' }}>Results</h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatCard label="Score" value={`${totalScore} / ${maxScore}`} colour="#6366f1" />
        <StatCard label="Correct" value={`${correct} / ${results.length}`} colour="#10b981" />
        <StatCard label="Time" value={formatTime(totalElapsed)} colour="#f59e0b" />
        <StatCard label="Accuracy" value={`${Math.round((correct / results.length) * 100)}%`} colour="#3b82f6" />
      </div>

      {/* Word-by-word table */}
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['#', 'Word', 'Your Answer', 'Result', 'Time', 'Points'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '0.7rem 1rem', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: '#1e293b' }}>{r.word}</td>
                  <td style={{ padding: '0.7rem 1rem', color: r.correct ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                    {r.typed || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>no answer</span>}
                  </td>
                  <td style={{ padding: '0.7rem 1rem' }}>
                    <span style={{
                      background: r.correct ? '#dcfce7' : '#fee2e2',
                      color: r.correct ? '#15803d' : '#dc2626',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}>
                      {r.correct ? '✅ Correct' : '❌ Wrong'}
                    </span>
                  </td>
                  <td style={{ padding: '0.7rem 1rem', color: '#64748b' }}>
                    {r.timeTaken > 0 ? `${r.timeTaken}s` : 'Timed out'}
                  </td>
                  <td style={{ padding: '0.7rem 1rem', fontWeight: 800, color: r.points > 0 ? '#6366f1' : '#94a3b8' }}>
                    {r.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onRetry} style={{
          padding: '0.85rem 2rem',
          fontSize: '1.05rem',
          fontWeight: 700,
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          minHeight: '52px',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}>
          🔄 Try Again
        </button>
        <button onClick={onHome} style={{
          padding: '0.85rem 2rem',
          fontSize: '1.05rem',
          fontWeight: 700,
          background: '#f1f5f9',
          color: '#475569',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          cursor: 'pointer',
          minHeight: '52px',
        }}>
          🏠 Home
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      padding: '1rem 1.5rem',
      minWidth: '120px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: colour }}>{value}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}
