const NOW = new Date("2026-03-06T00:00:00");
let appState = {
  rows: [],
  filtered: [],
  sortKey: "date",
  sortAsc: false
};

function toDateSafe(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((a - b) / ms);
}

function unique(arr) {
  return [...new Set(arr)];
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key] || "Unspecified";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function detectSource(row) {
  const t = `${row.category} ${row.metric_name} ${row.summary}`.toLowerCase();
  if (t.includes("escalat")) return "Internal Escalation";
  if (t.includes("alert")) return "NPCI Alert";
  if (t.includes("advisory")) return "NPCI Advisory";
  return "NPCI Circular";
}

function detectRisk(row) {
  const t = `${row.status} ${row.summary}`.toLowerCase();
  if (t.includes("critical")) return "Critical";
  if (t.includes("business at risk") || t.includes("urgent")) return "High";
  if (t.includes("high priority")) return "High";
  if (t.includes("pending") || t.includes("upcoming")) return "Medium";
  if (t.includes("closed") || t.includes("submitted")) return "Low";
  return "Low";
}

function detectProductImpact(row) {
  const t = `${row.metric_name} ${row.summary}`.toLowerCase();
  if (t.includes("vpa")) return "VPA";
  if (t.includes("upi")) return "UPI";
  if (t.includes("merchant")) return "Merchant";
  if (t.includes("fraud")) return "Fraud Monitoring";
  if (t.includes("settlement")) return "Settlement";
  return "Operations";
}

function normalizeStatus(row) {
  const t = `${row.status} ${row.summary}`.toLowerCase();
  if (t.includes("closed") || t.includes("resolved")) return "Closed";
  if (t.includes("in progress")) return "In Progress";
  if (t.includes("pending") || t.includes("clarification")) return "Pending Clarification";
  return "Open";
}

function parseDeadline(row) {
  const fromStatus = (row.status || "").match(/due by\s*(\d{4}-\d{2}-\d{2})/i);
  if (fromStatus) return fromStatus[1];

  const base = toDateSafe(row.date);
  const value = (row.metric_value || "").toLowerCase();

  if (value === "today") {
    if (!base) return NOW.toISOString().slice(0, 10);
    return base.toISOString().slice(0, 10);
  }

  const daysMatch = value.match(/(\d+)\s*days?/);
  if (daysMatch && base) {
    const d = new Date(base);
    d.setDate(d.getDate() + Number(daysMatch[1]));
    return d.toISOString().slice(0, 10);
  }

  return "";
}

function deadlineBucket(deadline) {
  const d = toDateSafe(deadline);
  if (!d) return "No Deadline";
  const diff = daysBetween(d, NOW);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due Today";
  if (diff <= 3) return "Due in 3 Days";
  if (diff <= 7) return "Due in 7 Days";
  return "Future";
}

function deriveOwnerTeam(row, allRows) {
  const stakeholders = allRows.filter(r => (r.category || "").toLowerCase().includes("stakeholder"));
  const owner = stakeholders.find(r => (r.metric_name || "").toLowerCase().includes("initial"));
  const escalation = stakeholders.find(r => (r.metric_name || "").toLowerCase().includes("escalation"));

  const text = `${row.summary} ${row.metric_name}`.toLowerCase();
  if (text.includes("escalat") && escalation) {
    return { owner: escalation.metric_value || "Escalation Owner", team: "Compliance Team" };
  }
  if (owner) {
    return { owner: owner.metric_value || "Compliance Owner", team: "Compliance Team" };
  }
  return { owner: "Unassigned", team: "Compliance Team" };
}

function escalationLevel(row) {
  const t = `${row.status} ${row.summary}`.toLowerCase();
  if (t.includes("urgent") || t.includes("business at risk") || t.includes("escalat")) return "L2";
  return "L1";
}

function enrichRows(rawRows) {
  return rawRows.map((r, i) => {
    const ownerTeam = deriveOwnerTeam(r, rawRows);
    const deadline = parseDeadline(r);
    const riskLevel = detectRisk(r);
    const status = normalizeStatus(r);

    return {
      ...r,
      noticeId: `NPCI-${String(i + 1).padStart(4, "0")}`,
      source: detectSource(r),
      category: r.category || "Uncategorized",
      riskLevel,
      productImpact: detectProductImpact(r),
      owner: ownerTeam.owner,
      ownerTeam: `${ownerTeam.owner} / ${ownerTeam.team}`,
      deadline,
      deadlineBucket: deadlineBucket(deadline),
      status,
      escalationLevel: escalationLevel(r),
      npciResponseStatus: status === "Closed" ? "Acknowledged" : "Awaiting NPCI Response",
      evidence: status === "Closed" ? "Submitted" : "Pending"
    };
  });
}

function weekLabel(v) {
  const d = toDateSafe(v);
  if (!d) return "Unknown";
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const dayMs = 86400000;
  const week = Math.ceil((((d - first) / dayMs) + first.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function createKpi(label, value, tone = "") {
  const card = document.createElement("div");
  card.className = `kpi ${tone}`.trim();
  card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
  return card;
}

function renderBars(el, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  el.innerHTML = "";

  entries.forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label" title="${k}">${k}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(v / max) * 100}%"></div></div>
      <div class="bar-value">${v}</div>
    `;
    el.appendChild(row);
  });
}

function buildFilter(id, values) {
  const el = document.getElementById(id);
  el.innerHTML = `<option value="All">All</option>`;
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
}

function applyFilters(rows) {
  const team = document.getElementById("teamFilter").value;
  const risk = document.getElementById("riskFilter").value;
  const category = document.getElementById("categoryFilter").value;
  const deadline = document.getElementById("deadlineFilter").value;

  return rows.filter(r => {
    const teamOk = team === "All" || r.ownerTeam.includes(team);
    const riskOk = risk === "All" || r.riskLevel === risk;
    const catOk = category === "All" || r.category === category;
    const deadlineOk = deadline === "All" || r.deadlineBucket === deadline;
    return teamOk && riskOk && catOk && deadlineOk;
  });
}

function sortRows(rows, key, asc) {
  return [...rows].sort((a, b) => {
    const av = (a[key] || "").toString().toLowerCase();
    const bv = (b[key] || "").toString().toLowerCase();
    if (av < bv) return asc ? -1 : 1;
    if (av > bv) return asc ? 1 : -1;
    return 0;
  });
}

function renderHeatmap(rows) {
  const counts = countBy(rows, "deadlineBucket");
  const heat = document.getElementById("deadlineHeatmap");
  heat.innerHTML = "";

  ["Overdue", "Due Today", "Due in 3 Days", "Due in 7 Days", "Future", "No Deadline"].forEach(k => {
    const tone = k === "Overdue" ? "overdue" : (k === "Due Today" ? "today" : "");
    const div = document.createElement("div");
    div.className = `heat ${tone}`.trim();
    div.innerHTML = `<div class="label">${k}</div><div class="value">${counts[k] || 0}</div>`;
    heat.appendChild(div);
  });
}

function renderKpis(rows) {
  const kpis = document.getElementById("kpis");
  const total = rows.length;
  const actionRequired = rows.filter(r => r.status !== "Closed").length;
  const urgent = rows.filter(r => ["Critical", "High"].includes(r.riskLevel)).length;
  const overdue = rows.filter(r => r.deadlineBucket === "Overdue").length;
  const closedWeek = rows.filter(r => r.status === "Closed" && weekLabel(r.date) === weekLabel(NOW.toISOString())).length;

  const respTimes = rows
    .filter(r => r.deadline)
    .map(r => {
      const dd = toDateSafe(r.deadline);
      const rd = toDateSafe(r.date);
      if (!dd || !rd) return null;
      return daysBetween(dd, rd);
    })
    .filter(v => v !== null);

  const avgResp = respTimes.length ? (respTimes.reduce((a, b) => a + b, 0) / respTimes.length).toFixed(1) : "0.0";
  const investigationsOpen = rows.filter(r => r.category.toLowerCase().includes("investigation") && r.status !== "Closed").length;
  const investigationsEsc = rows.filter(r => r.category.toLowerCase().includes("investigation") && r.escalationLevel === "L2").length;

  kpis.innerHTML = "";
  kpis.appendChild(createKpi("Total NPCI Notices", total));
  kpis.appendChild(createKpi("Action Required", actionRequired, actionRequired ? "warn" : "ok"));
  kpis.appendChild(createKpi("Urgent Notices", urgent, urgent ? "danger" : "ok"));
  kpis.appendChild(createKpi("Overdue Notices", overdue, overdue ? "danger" : "ok"));
  kpis.appendChild(createKpi("Closed This Week", closedWeek, "ok"));
  kpis.appendChild(createKpi("Avg Response Time (Days)", avgResp));
  kpis.appendChild(createKpi("Investigations Open", investigationsOpen));
  kpis.appendChild(createKpi("Investigations Escalated", investigationsEsc, investigationsEsc ? "warn" : "ok"));
}

function riskBadgeClass(risk) {
  if (risk === "Critical") return "critical";
  if (risk === "High") return "high";
  return "";
}

function renderTable(rows) {
  const tbody = document.getElementById("rows");
  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date || "-"}</td>
      <td>${r.noticeId}</td>
      <td>${r.source}</td>
      <td>${r.category}</td>
      <td><span class="badge ${riskBadgeClass(r.riskLevel)}">${r.riskLevel}</span></td>
      <td>${r.productImpact}</td>
      <td>${r.ownerTeam}</td>
      <td>${r.deadline || "-"}</td>
      <td>${r.status}</td>
      <td>${r.summary || "-"}</td>
      <td>${r.evidence}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAutomationMetrics(rawSourceRows, enrichedRows) {
  const list = document.getElementById("automationList");
  const autoParsed = rawSourceRows;
  const classified = enrichedRows.length;
  const autoCreated = enrichedRows.filter(r => r.status !== "Closed").length;
  const manualReview = enrichedRows.filter(r => r.riskLevel === "Critical").length;

  list.innerHTML = "";
  [
    `Emails automatically parsed: ${autoParsed}`,
    `Notices classified automatically: ${classified}`,
    `Tasks auto-created: ${autoCreated}`,
    `Items requiring manual review: ${manualReview}`
  ].forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

function renderAll(rows) {
  renderKpis(rows);
  renderBars(document.getElementById("categoryChart"), countBy(rows, "category"));
  renderBars(document.getElementById("riskChart"), countBy(rows, "riskLevel"));
  renderBars(document.getElementById("productChart"), countBy(rows, "productImpact"));
  renderBars(document.getElementById("ownerChart"), countBy(rows, "ownerTeam"));
  renderBars(document.getElementById("statusChart"), countBy(rows, "status"));
  renderBars(document.getElementById("trendChart"), countBy(rows, "week"));
  renderHeatmap(rows);

  const sorted = sortRows(rows, appState.sortKey, appState.sortAsc);
  renderTable(sorted);
}

function copilotAnswer(question, rows) {
  const q = question.toLowerCase();

  if (q.includes("due this week") || q.includes("deadline")) {
    const dueSoon = rows.filter(r => ["Due Today", "Due in 3 Days", "Due in 7 Days"].includes(r.deadlineBucket));
    if (!dueSoon.length) return "No notices are due within 7 days.";
    return dueSoon.map(r => `${r.noticeId} | ${r.deadlineBucket} | ${r.category} | ${r.ownerTeam}`).join("\n");
  }

  if (q.includes("high risk") || q.includes("critical")) {
    const risky = rows.filter(r => ["Critical", "High"].includes(r.riskLevel));
    if (!risky.length) return "No high-risk notices in the current filter view.";
    return risky.map(r => `${r.noticeId} | ${r.riskLevel} | ${r.summary}`).join("\n");
  }

  if (q.includes("vpa")) {
    const vpa = rows.filter(r => (r.productImpact || "").toLowerCase().includes("vpa"));
    if (!vpa.length) return "No VPA-related notices found in current view.";
    return vpa.map(r => `${r.noticeId} | ${r.status} | deadline ${r.deadline || "-"}`).join("\n");
  }

  if (q.includes("miss") || q.includes("overdue")) {
    const missed = rows.filter(r => r.deadlineBucket === "Overdue");
    if (!missed.length) return "No overdue notices at the moment.";
    return missed.map(r => `${r.noticeId} | ${r.ownerTeam} | ${r.deadline}`).join("\n");
  }

  return "Try queries like: 'What notices are due this week?', 'Which investigations are high risk?', or 'Show VPA tasks'.";
}

function wireEvents() {
  ["teamFilter", "riskFilter", "categoryFilter", "deadlineFilter"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      appState.filtered = applyFilters(appState.rows);
      renderAll(appState.filtered);
    });
  });

  document.querySelectorAll("#noticeTable th").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (!key) return;
      if (appState.sortKey === key) {
        appState.sortAsc = !appState.sortAsc;
      } else {
        appState.sortKey = key;
        appState.sortAsc = true;
      }
      renderAll(appState.filtered);
    });
  });

  document.getElementById("copilotAsk").addEventListener("click", () => {
    const q = document.getElementById("copilotInput").value.trim();
    const out = document.getElementById("copilotOutput");
    out.textContent = q ? copilotAnswer(q, appState.filtered) : "Type a compliance question first.";
  });
}

async function init() {
  let data = window.__DASHBOARD_DATA__;
  if (!data) {
    const res = await fetch("./data.json");
    data = await res.json();
  }

  const rawRows = data.metrics || [];
  const enriched = enrichRows(rawRows).map(r => ({ ...r, week: weekLabel(r.date) }));

  appState.rows = enriched;
  buildFilter("teamFilter", unique(enriched.map(r => r.owner).filter(Boolean)).sort());
  buildFilter("riskFilter", ["Critical", "High", "Medium", "Low"]);
  buildFilter("categoryFilter", unique(enriched.map(r => r.category)).sort());

  appState.filtered = applyFilters(appState.rows);
  renderAutomationMetrics(data.source_rows || 0, appState.rows);
  renderAll(appState.filtered);

  document.getElementById("copilotOutput").textContent = "Ask a query to get an instant compliance summary.";
  wireEvents();
}

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style=\"padding:16px\">Failed to load dashboard data: ${err}</pre>`;
});
