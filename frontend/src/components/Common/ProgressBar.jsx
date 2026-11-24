function ProgressBar({ value, label }) {
  const clamped = Math.max(0, Math.min(100, value || 0));

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default ProgressBar;
