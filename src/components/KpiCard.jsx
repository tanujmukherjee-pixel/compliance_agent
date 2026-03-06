export default function KpiCard({ label, value, sub, accent = "text-[#1F3864]", border = "border-l-4 border-[#1F3864]" }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-5 ${border}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`text-4xl font-black mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
