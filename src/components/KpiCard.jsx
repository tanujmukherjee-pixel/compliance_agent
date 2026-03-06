export default function KpiCard({ label, value, icon, sub, accent = "text-[#1F3864]", border = "border-l-4 border-[#1F3864]", progress, progressColor = "bg-[#1F3864]" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 ${border} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 leading-tight">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-4xl font-black mt-2 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {progress != null && (
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${progressColor} transition-all`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  );
}
