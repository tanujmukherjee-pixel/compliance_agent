const SEV = {
  CRITICAL: { cls: "bg-red-600 text-white ring-2 ring-red-300", icon: "🔴" },
  HIGH:     { cls: "bg-orange-500 text-white ring-2 ring-orange-200", icon: "🟠" },
  MEDIUM:   { cls: "bg-yellow-400 text-gray-900", icon: "🟡" },
  LOW:      { cls: "bg-green-600 text-white", icon: "🟢" },
};

export default function SeverityBadge({ level }) {
  const s = SEV[level] ?? { cls: "bg-gray-400 text-white", icon: "⚪" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${s.cls}`}>
      {s.icon} {level}
    </span>
  );
}
