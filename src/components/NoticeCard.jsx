import SeverityBadge from './SeverityBadge';

const SEV_RING = {
  CRITICAL: "border-l-4 border-red-600 bg-red-50",
  HIGH:     "border-l-4 border-orange-400 bg-orange-50",
  MEDIUM:   "border-l-4 border-yellow-400 bg-yellow-50",
  LOW:      "border-l-4 border-green-500 bg-green-50",
};

const TODAY = "2026-03-06";

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date(TODAY)) / 86400000);
}

function CountdownBadge({ deadline, tatDays }) {
  const d = daysLeft(deadline);
  if (d === null) return null;
  if (d < 0) return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">⚠ OVERDUE {Math.abs(d)}d</span>
  );
  if (d === 0) return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">⏱ DUE TODAY</span>
  );
  if (d <= 2) return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">⏱ {d}d left</span>
  );
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">TAT {tatDays}d · Due {deadline}</span>
  );
}

export default function NoticeCard({ notice }) {
  const d = daysLeft(notice.deadline);
  const tatPct = notice.tatDays > 0
    ? Math.min(100, ((notice.tatDays - Math.max(0, d ?? 0)) / notice.tatDays) * 100)
    : 100;
  return (
    <div className={`rounded-2xl shadow-sm p-5 ${SEV_RING[notice.severity] ?? "border-l-4 border-gray-400"} hover:shadow-md transition-shadow`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <span className="text-xs font-mono text-gray-400">{notice.id}</span>
          <h3 className="font-bold text-gray-900 mt-0.5 text-sm leading-snug">{notice.subject}</h3>
        </div>
        <SeverityBadge level={notice.severity} />
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{notice.summary}</p>

      {/* Action Required */}
      {notice.actionRequired && (
        <div className="mt-2 text-xs text-gray-700 bg-white/60 rounded-lg px-3 py-2 border border-gray-200">
          <span className="font-semibold text-gray-800">Action: </span>{notice.actionRequired}
        </div>
      )}

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span>📅 {notice.date} · {notice.time}</span>
        <span>👤 {notice.sender} · {notice.senderTitle}</span>
        {notice.system && <span>🔧 {notice.system}</span>}
        <span>👥 {notice.ownerTeam}</span>
      </div>

      {/* TAT progress bar */}
      {notice.tatDays > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>SLA consumed</span>
            <span>{Math.round(tatPct)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${tatPct >= 90 ? "bg-red-500" : tatPct >= 70 ? "bg-orange-400" : "bg-green-500"}`}
              style={{ width: `${tatPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        <CountdownBadge deadline={notice.deadline} tatDays={notice.tatDays} />
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{notice.status}</span>
        {notice.businessRisk && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">⚠ Business at Risk</span>
        )}
        {notice.escalated && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">↑ Escalated</span>
        )}
      </div>
    </div>
  );
}
