export default function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p className="muted small">{label}</p>
      <h3>{value}</h3>
      {hint ? <p className="helper-text">{hint}</p> : null}
    </div>
  );
}
