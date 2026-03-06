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

async function init() {
  let data = window.__DASHBOARD_DATA__;
  if (!data) {
    const res = await fetch("./data.json");
    data = await res.json();
  }
  const metrics = data.metrics || [];

  const urgentCount = metrics.filter(m => urgencyLevel(m.status, m.summary)).length;
  const pendingCount = metrics.filter(m => (m.status || "").toLowerCase().includes("pending")).length;

  const kpis = document.getElementById("kpis");
  kpis.appendChild(createKpi("Source Emails", data.source_rows || 0));
  kpis.appendChild(createKpi("Parsed Metrics", metrics.length));
  kpis.appendChild(createKpi("Urgent / Risk", urgentCount));
  kpis.appendChild(createKpi("Pending", pendingCount));

  renderBars(document.getElementById("categoryChart"), countBy(metrics, "category"));
  renderBars(document.getElementById("statusChart"), countBy(metrics, "status"));

  const tbody = document.getElementById("rows");
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
