const SHEET_ID = "17hUKu3p78VPnpZQfWXBMwz9GjeT1Dd37TR0ZCUdsPr8";
const SHEET_GID = "0";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const k = (item[key] || "Unspecified").toString().trim() || "Unspecified";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function createKpi(label, value) {
  const card = document.createElement("div");
  card.className = "kpi";
  card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
  return card;
}

function renderBars(el, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  el.innerHTML = "";

  entries.forEach(([label, val]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const pct = (val / max) * 100;
    row.innerHTML = `
      <div class="bar-label" title="${label}">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-value">${val}</div>
    `;
    el.appendChild(row);
  });
}

function urgencyLevel(status, summary) {
  const text = `${status} ${summary}`.toLowerCase();
  return text.includes("urgent") || text.includes("high priority") || text.includes("risk");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") i++;
      row.push(value);
      value = "";
      if (row.some(cell => cell !== "")) rows.push(row);
      row = [];
    } else {
      value += c;
    }
  }

  row.push(value);
  if (row.some(cell => cell !== "")) rows.push(row);

  return rows;
}

function normalizeHeader(h) {
  return (h || "").toString().trim().toLowerCase();
}

function extractRowsFromSheetCsv(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return { source_rows: 0, metrics: [] };

  const headers = rows[0];
  const map = {};
  headers.forEach((h, i) => {
    map[normalizeHeader(h)] = i;
  });

  const dateIdx = map["npci email date"];
  const detailsIdx = map["npci email details"];
  const statusIdx = map["status"];

  if (statusIdx === undefined) {
    return { source_rows: 0, metrics: [] };
  }

  const metrics = [];
  const dataRows = rows.slice(1);

  dataRows.forEach(r => {
    const email_date = r[dateIdx] || "";
    const email_details = r[detailsIdx] || "";
    const statusRaw = r[statusIdx] || "";
    if (!statusRaw.trim()) return;

    let parsed;
    try {
      parsed = JSON.parse(statusRaw);
    } catch (_) {
      parsed = [];
    }

    const arr = Array.isArray(parsed) ? parsed : [parsed];
    arr.forEach(item => {
      if (!item || typeof item !== "object") return;
      metrics.push({
        email_date,
        email_details,
        date: item.date || "",
        category: item.category || "",
        metric_name: item.metric_name || "",
        metric_value: item.metric_value != null ? String(item.metric_value) : "",
        status: item.status || "",
        summary: item.summary || ""
      });
    });
  });

  return { source_rows: dataRows.length, metrics };
}

async function fetchLiveSheetData() {
  const url = `${SHEET_CSV_URL}&_ts=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Sheet fetch failed (${res.status})`);
  }
  const csv = await res.text();
  const parsed = extractRowsFromSheetCsv(csv);
  if (!parsed.metrics.length) {
    throw new Error("Google Sheet returned no parsed metrics");
  }
  return parsed;
}

function setSourceInfo(text) {
  const el = document.getElementById("sourceInfo");
  if (el) el.textContent = text;
}

async function loadDashboardData() {
  try {
    const live = await fetchLiveSheetData();
    setSourceInfo(`Data source: Live Google Sheet (${new Date().toLocaleString()})`);
    return live;
  } catch (err) {
    console.warn("Live sheet unavailable, using fallback:", err);
  }

  if (window.__DASHBOARD_DATA__) {
    setSourceInfo("Data source: Local fallback snapshot (Google Sheet unavailable)");
    return window.__DASHBOARD_DATA__;
  }

  const res = await fetch("./data.json", { cache: "no-store" });
  const json = await res.json();
  setSourceInfo("Data source: data.json fallback (Google Sheet unavailable)");
  return json;
}

async function init() {
  const data = await loadDashboardData();
  const metrics = data.metrics || [];

  const urgentCount = metrics.filter(m => urgencyLevel(m.status, m.summary)).length;
  const pendingCount = metrics.filter(m => (m.status || "").toLowerCase().includes("pending")).length;

  const kpis = document.getElementById("kpis");
  kpis.innerHTML = "";
  kpis.appendChild(createKpi("Source Emails", data.source_rows || 0));
  kpis.appendChild(createKpi("Parsed Metrics", metrics.length));
  kpis.appendChild(createKpi("Urgent / Risk", urgentCount));
  kpis.appendChild(createKpi("Pending", pendingCount));

  renderBars(document.getElementById("categoryChart"), countBy(metrics, "category"));
  renderBars(document.getElementById("statusChart"), countBy(metrics, "status"));

  const tbody = document.getElementById("rows");
  tbody.innerHTML = "";
  metrics.forEach(m => {
    const tr = document.createElement("tr");
    const warn = urgencyLevel(m.status, m.summary) ? "warn" : "";
    tr.innerHTML = `
      <td>${m.date || "-"}</td>
      <td>${m.category || "-"}</td>
      <td>${m.metric_name || "-"}</td>
      <td>${m.metric_value || "-"}</td>
      <td><span class="badge ${warn}">${m.status || "-"}</span></td>
      <td>${m.summary || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:16px">Failed to load dashboard data: ${err}</pre>`;
});
