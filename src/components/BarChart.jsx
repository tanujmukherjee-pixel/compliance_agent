export default function BarChart({ data, color = "#1F3864" }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  if (!entries.length) return <p className="text-xs text-gray-400">No data</p>;
  return (
    <div className="space-y-3">
      {entries.map(([label, val]) => {
        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
        return (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 truncate max-w-[200px]" title={label}>{label}</span>
              <span className="text-xs font-bold text-gray-700 ml-2 shrink-0">
                {val} <span className="text-gray-400 font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(val / max) * 100}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
