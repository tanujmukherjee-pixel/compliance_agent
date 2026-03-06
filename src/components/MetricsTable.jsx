function urgency(status, summary) {
  const t = `${status} ${summary}`.toLowerCase();
  return t.includes("urgent") || t.includes("high priority") || t.includes("risk") || t.includes("critical");
}

export default function MetricsTable({ metrics }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-[#1F3864] text-white">
            {["Date","System","Metric","Value","Status","Deadline","Action Required","Summary"].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-xs tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => {
            const hot = urgency(m.status, m.summary);
            return (
              <tr key={i} className={`border-b border-gray-100 ${hot ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{m.date || "—"}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{m.system || "—"}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{m.metric_name || "—"}</td>
                <td className="px-3 py-2 font-bold text-[#1F3864] whitespace-nowrap">{m.metric_value || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${hot ? "bg-orange-100 text-orange-700" : "bg-teal-50 text-teal-700"}`}>
                    {m.status || "—"}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-red-600 whitespace-nowrap">{m.deadline || "—"}</td>
                <td className="px-3 py-2 text-gray-600 text-xs max-w-[200px]">{m.action_required || "—"}</td>
                <td className="px-3 py-2 text-gray-500 text-xs max-w-xs">{m.summary || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
