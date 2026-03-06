import { useState, useEffect } from "react";
import { fetchSheetData, FALLBACK_DATA, NOTICES } from "./data";
import KpiCard from "./components/KpiCard";
import BarChart from "./components/BarChart";
import NoticeCard from "./components/NoticeCard";
import RoutingMatrix from "./components/RoutingMatrix";
import MetricsTable from "./components/MetricsTable";

const TABS = ["Dashboard", "Notice Detail", "Routing Matrix", "Metrics Log"];

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

  useEffect(() => {
    fetchSheetData()
      .then(d => { setData(d); setSource("live"); })
      .catch(() => setSource("fallback"))
      .finally(() => setLoading(false));
  }, []);

  const { metrics } = data;
  const critical = NOTICES.filter(n => n.severity === "CRITICAL").length;
  const high = NOTICES.filter(n => n.severity === "HIGH").length;
  const overdue = NOTICES.filter(n => n.deadline < "2026-03-06").length;
  const biz = NOTICES.filter(n => n.businessRisk).length;
  const escalated = NOTICES.filter(n => n.escalated).length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-[#1F3864] text-white px-6 py-5 shadow-lg">
        <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1">
          CompSec · NPCI Monitoring
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Agent Dashboard</h1>
        <p className="text-sm text-blue-100 mt-1">
          {source === "live"
            ? `Live data · ${data.source_rows} source row(s)`
            : "Fallback data · connect Google Sheet for live sync"}
          {loading && " · fetching…"}
        </p>
      </header>

      {/* Tab bar */}
      <nav className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === i
                ? "border-[#1F3864] text-[#1F3864]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Tab 0: Dashboard ── */}
        {tab === 0 && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard label="Total Notices" value={NOTICES.length} color="bg-[#1F3864]" />
              <KpiCard label="Critical" value={critical} color="bg-red-600" />
              <KpiCard label="High Priority" value={high} color="bg-orange-500" />
              <KpiCard label="Overdue" value={overdue} color="bg-red-500" />
              <KpiCard label="Business at Risk" value={biz} color="bg-red-700" />
              <KpiCard label="Escalated" value={escalated} color="bg-purple-600" />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Metrics by Category</h2>
                <BarChart data={categoryCounts(metrics)} color="#1F3864" />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Metrics by Status</h2>
                <BarChart data={statusCounts(metrics)} color="#E76F00" />
              </div>
            </div>

            {/* Notices */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Notices</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {NOTICES.map(n => <NoticeCard key={n.id} notice={n} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 1: Notice Detail ── */}
        {tab === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Notice Register</h2>
            {NOTICES.map(n => <NoticeCard key={n.id} notice={n} expanded />)}
          </div>
        )}

        {/* ── Tab 2: Routing Matrix ── */}
        {tab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Stakeholder Routing Matrix</h2>
            <RoutingMatrix notices={NOTICES} />
          </div>
        )}

        {/* ── Tab 3: Metrics Log ── */}
        {tab === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Metrics Log
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({metrics.length} rows)
              </span>
            </h2>
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
