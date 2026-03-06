const MATRIX = [
  { stakeholder: "CEO",              critical: "Always ✓",    high: "If penalty risk", medium: "—",       low: "—",        action: "Alert sent (NPCI-001-E1)" },
  { stakeholder: "Company Secretary",critical: "Primary ✓",   high: "Primary ✓",       medium: "Primary ✓",low: "Primary ✓",action: "Owner – both notices" },
  { stakeholder: "Compliance Head",  critical: "Always ✓",    high: "Always ✓",        medium: "Always ✓",low: "Review",   action: "Review NPCI-001-E1 immediately" },
  { stakeholder: "Legal",            critical: "Always ✓",    high: "If legal risk",   medium: "If req.", low: "—",        action: "Assess legal exposure" },
  { stakeholder: "Tax",              critical: "If tax ✓",    high: "If tax ✓",        medium: "If tax ✓",low: "—",        action: "—" },
  { stakeholder: "Tech / Ops",       critical: "If NPCI ✓",   high: "If NPCI/RBI ✓",  medium: "If NPCI ✓",low: "If NPCI ✓",action: "Primary responder (VPA investigation)" },
];

function Cell({ val }) {
  if (val === "—") return <span className="text-gray-300">—</span>;
  if (val.includes("Always") || val.includes("Primary")) return <span className="text-green-700 font-semibold">{val}</span>;
  if (val.includes("If")) return <span className="text-orange-600 font-medium">{val}</span>;
  return <span>{val}</span>;
}

export default function RoutingMatrix() {
  return (
    <div>
      <div className="mb-3 bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold">
        ⚠ CRITICAL ESCALATION: NPCI-001-E1 — Slack + WhatsApp alert to CEO & Compliance Head triggered within 5 minutes of ingestion.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-[#1F3864] text-white">
              {["Stakeholder","CRITICAL","HIGH","MEDIUM","LOW","Action for NPCI-001/E1"].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-xs tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row, i) => (
              <tr key={row.stakeholder} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2 font-semibold text-gray-800">{row.stakeholder}</td>
                <td className="px-3 py-2 bg-red-50"><Cell val={row.critical} /></td>
                <td className="px-3 py-2 bg-orange-50"><Cell val={row.high} /></td>
                <td className="px-3 py-2"><Cell val={row.medium} /></td>
                <td className="px-3 py-2"><Cell val={row.low} /></td>
                <td className="px-3 py-2 text-gray-600 text-xs">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
