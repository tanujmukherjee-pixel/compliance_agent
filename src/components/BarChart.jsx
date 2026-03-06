export default function BarChart({ data, colorClass = "bg-[#1F3864]" }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-2">
      {entries.map(([label, val]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-36 text-xs text-gray-500 truncate text-right shrink-0" title={label}>{label}</span>
          <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${colorClass} transition-all`}
              style={{ width: `${(val / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-xs font-bold text-gray-700 text-right">{val}</span>
        </div>
      ))}
    </div>
  );
}
