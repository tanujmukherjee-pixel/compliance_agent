import { useState, useEffect } from "react";
import { fetchSheetData, FALLBACK_DATA, NOTICES } from "./data";
import KpiCard from "./components/KpiCard";
import BarChart from "./components/BarChart";
import NoticeCard from "./components/NoticeCard";
import RoutingMatrix from "./components/RoutingMatrix";
import MetricsTable from "./components/MetricsTable";

const TODAY = "2026-03-06";
const TAB_LABELS = ["Dashboard", "Notice Detail", "Routing Matrix", "Metrics Log"];

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date(TODAY)) / 86400000);
}

function categoryCounts(metrics) {
  const m = {};
  metrics.forEach(r => { m[r.category] = (m[r.category] || 0) + 1; });
  return m;
}

function statusCounts(metrics) {
  const m = {};
  metrics.forEach(r => { m[r.status] = (m[r.status] || 0) + 1; });
  return m;
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(FALLBACK_DATA);
  const [source, setSource] = useState("fallback");
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetchSheetData()
      .then(d => { setData(d); setSource("live"); })
      .catch(() => setSource("fallback"))
      .finally(() => setLoading(false));
  }, []);

  const { metrics } = data;
  const criticalNotices = NOTICES.filter(n => n.severity === "CRITICAL");
  const critical = criticalNotices.length;
  const high = NOTICES.filter(n => n.severity === "HIGH").length;
  const biz = NOTICES.filter(n => n.businessRisk).length;
  const escalated = NOTICES.filter(n => n.escalated).length;
  const urgentCount = NOTICES.filter(n => n.severity === "CRITICAL" || n.severity === "HIGH").length;

  const nextDeadline = NOTICES
    .filter(n => (daysLeft(n.deadline) ?? -1) >= 0)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  const TAB_BADGES = [null, urgentCount > 0 ? urgentCount : null, null, null];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Sticky Critical Banner ── */}
      {!bannerDismissed && critical > 0 && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center gap-3">
          <span className="text-lg shrink-0">🚨</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm">
              {critical} CRITICAL notice{critical > 1 ? "s" : ""} require immediate action
            </span>
            {criticalNotices[0] && (
              <span className="ml-2 text-red-200 text-xs hidden sm:inline">
                · {criticalNotices[0].subject} — due {criticalNotices[0].deadline}
              </span>
            )}
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-red-200 hover:text-white text-xl leading-none px-1 shrink-0"
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-[#1F3864] text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1">
              CompSec · NPCI Monitoring
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Compliance Agent Dashboard</h1>
          </div>
          <div className="text-right shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              source === "live" ? "bg-green-500/20 text-green-200" : "bg-yellow-500/20 text-yellow-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${source === "live" ? "bg-green-400" : "bg-yellow-400"}`} />
              {loading ? "Fetching…" : source === "live" ? `Live · ${data.source_rows} row(s)` : "Fallback data"}
            </span>
            <p className="text-xs text-blue-300 mt-1.5">{TODAY}</p>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <nav className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex gap-1">
          {TAB_LABELS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === i
                  ? "border-[#1F3864] text-[#1F3864]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
              {TAB_BADGES[i] != null && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-red-500 text-white">
                  {TAB_BADGES[i]}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Tab 0: Dashboard ── */}
        {tab === 0 && (
          <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard
                label="Active Notices" value={NOTICES.length} icon="📋"
                border="border-l-4 border-[#1F3864]" accent="text-[#1F3864]"
                sub="total tracked"
              />
              <KpiCard
                label="Critical" value={critical} icon="🔴"
                border="border-l-4 border-red-600" accent="text-red-600"
                sub="action required today"
                progress={NOTICES.length ? (critical / NOTICES.length) * 100 : 0}
                progressColor="bg-red-500"
              />
              <KpiCard
                label="High Priority" value={high} icon="🟠"
                border="border-l-4 border-orange-500" accent="text-orange-500"
                sub="within 72h TAT"
                progress={NOTICES.length ? (high / NOTICES.length) * 100 : 0}
                progressColor="bg-orange-400"
              />
              <KpiCard
                label="Business at Risk" value={biz} icon="⚠️"
                border="border-l-4 border-red-700" accent="text-red-700"
                sub={escalated > 0 ? `${escalated} escalated to CEO` : "monitor closely"}
              />
              <KpiCard
                label="Next Deadline" icon="⏱"
                value={nextDeadline ? `${Math.max(0, daysLeft(nextDeadline.deadline))}d` : "—"}
                border={`border-l-4 ${nextDeadline && daysLeft(nextDeadline.deadline) <= 1 ? "border-red-500" : "border-yellow-400"}`}
                accent={nextDeadline && daysLeft(nextDeadline.deadline) <= 1 ? "text-red-600" : "text-yellow-600"}
                sub={nextDeadline ? nextDeadline.deadline : "no upcoming"}
              />
            </div>

            {/* Action Items Panel */}
            {NOTICES.filter(n => n.severity === "CRITICAL" || n.businessRisk).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h2 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                  🎯 Immediate Actions Required
                </h2>
                <ul className="space-y-2">
                  {NOTICES.filter(n => n.severity === "CRITICAL" || n.businessRisk).map(n => (
                    <li key={n.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">!</span>
                      <div>
                        <span className="font-semibold text-red-900">{n.actionRequired || n.summary}</span>
                        <span className="ml-2 text-xs text-red-500">· due {n.deadline} · {n.ownerTeam}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Metrics by Category</h2>
                <p className="text-xs text-gray-400 mb-4">{metrics.length} total metric rows</p>
                <BarChart data={categoryCounts(metrics)} color="#1F3864" />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Metrics by Status</h2>
                <p className="text-xs text-gray-400 mb-4">Current status distribution</p>
                <BarChart data={statusCounts(metrics)} color="#E76F00" />
              </div>
            </div>

            {/* Active Notices */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Active Notices</h2>
                <button onClick={() => setTab(1)} className="text-xs text-[#1F3864] hover:underline font-medium">
                  View all →
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {NOTICES.map(n => <NoticeCard key={n.id} notice={n} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 1: Notice Detail ── */}
        {tab === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Notice Register</h2>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">{NOTICES.length} notices</span>
            </div>
            {NOTICES.map(n => <NoticeCard key={n.id} notice={n} />)}
          </div>
        )}

        {/* ── Tab 2: Routing Matrix ── */}
        {tab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Stakeholder Routing Matrix</h2>
            <p className="text-xs text-gray-400 mb-4">Who gets notified based on severity level</p>
            <RoutingMatrix notices={NOTICES} />
          </div>
        )}

        {/* ── Tab 3: Metrics Log ── */}
        {tab === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Metrics Log</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {metrics.length} rows · {source === "live" ? "Google Sheet · Sheet2" : "fallback data"}
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                source === "live" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {source === "live" ? "● Live" : "● Fallback"}
              </span>
            </div>
            <MetricsTable metrics={metrics} />
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 mt-8">
        CompSec · NPCI Compliance Monitoring · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
