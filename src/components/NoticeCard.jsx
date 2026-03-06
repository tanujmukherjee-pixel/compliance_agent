import SeverityBadge from './SeverityBadge';

const SEV_RING = {
  CRITICAL: "border-l-4 border-red-600 bg-red-50",
  HIGH:     "border-l-4 border-orange-400 bg-orange-50",
  MEDIUM:   "border-l-4 border-yellow-400 bg-yellow-50",
  LOW:      "border-l-4 border-green-500 bg-green-50",
};

export default function NoticeCard({ notice }) {
  const isOverdue = notice.deadline < new Date().toISOString().slice(0, 10);
  return (
    <div className={`rounded-2xl shadow p-5 ${SEV_RING[notice.severity] ?? "border-l-4 border-gray-400"}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <span className="text-xs font-mono text-gray-400">{notice.id}</span>
          <h3 className="font-bold text-gray-900 mt-0.5 text-sm leading-snug">{notice.subject}</h3>
        </div>
        <SeverityBadge level={notice.severity} />
      </div>

      <p className="text-xs text-gray-500 mt-2">{notice.summary}</p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
        <span>📅 <strong>{notice.date}</strong> · {notice.time}</span>
        <span>👤 {notice.sender} · {notice.senderTitle}</span>
        <span>🏷 {notice.category}</span>
        {notice.system && <span>🔧 System: <strong>{notice.system}</strong></span>}
        <span>👥 {notice.ownerTeam}</span>
      </div>
      {notice.actionRequired && (
        <div className="mt-2 text-xs text-gray-700 bg-white/60 rounded-lg px-3 py-2 border border-gray-200">
          <span className="font-semibold text-gray-800">Action Required: </span>{notice.actionRequired}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {isOverdue ? '⚠ OVERDUE' : `TAT ${notice.tatDays}d`} · Due {notice.deadline}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {notice.status}
        </span>
        {notice.businessRisk && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">Business at Risk</span>
        )}
        {notice.escalated && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">Escalated</span>
        )}
      </div>
    </div>
  );
}
