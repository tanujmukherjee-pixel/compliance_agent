// Google Sheet data source
export const SHEET_ID = "17hUKu3p78VPnpZQfWXBMwz9GjeT1Dd37TR0ZCUdsPr8";
export const SHEET_NAME = "Sheet2";
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// Fallback static data from NPCI_circulars.xlsx
export const FALLBACK_DATA = {
  source_rows: 2,
  metrics_rows: 7,
  metrics: [
    {
      date: "2026-03-05",
      category: "Compliance Investigation",
      metric_name: "VPA Investigation Request",
      metric_value: "1",
      status: "Pending Clarification",
      summary: "Ravi Jain (Sr. Director - Central Data Product) requested an investigation and clarification on specific VPAs based on a compliance requirement.",
    },
    {
      date: "2026-03-05",
      category: "Deadlines & Follow-ups",
      metric_name: "Clarification Deadline (Days)",
      metric_value: "3",
      status: "Due by 2026-03-08",
      summary: "The clarification for the VPA investigation is needed within 3 days of the request.",
    },
    {
      date: "2026-03-05",
      category: "Compliance",
      metric_name: "VPA Investigation Task",
      metric_value: "1",
      status: "High Priority",
      summary: "Investigate specific Virtual Payment Addresses (VPAs) to meet an NPCI-related compliance requirement, identified as placing 'Business at risk'.",
    },
    {
      date: "2026-03-05",
      category: "Deadline",
      metric_name: "Compliance Clarification Due",
      metric_value: "3 days",
      status: "Upcoming",
      summary: "Initial clarification regarding the VPA investigation is required within three days.",
    },
    {
      date: "2026-03-05",
      category: "Deadline",
      metric_name: "Internal Status Update",
      metric_value: "Today",
      status: "Urgent",
      summary: "An urgent status update on the requirement must be provided by the end of today.",
    },
    {
      date: "2026-03-05",
      category: "Stakeholder",
      metric_name: "Requester (Initial)",
      metric_value: "Ravi Jain",
      status: "Sr. Director",
      summary: "The investigation task was initially requested by Ravi Jain.",
    },
    {
      date: "2026-03-05",
      category: "Stakeholder",
      metric_name: "Requester (Escalation)",
      metric_value: "Shyam Rao",
      status: "Priority Escalation",
      summary: "The task was escalated by Shyam Rao with an increased urgency.",
    },
  ],
};

// Enriched notice records from the raw emails (CompSec-style)
export const NOTICES = [
  {
    id: "NPCI-001",
    date: "2026-03-05",
    time: "17:12 IST",
    sender: "Ravi Jain",
    senderTitle: "Sr. Director – Central Data Product",
    subject: "VPA Investigation – Compliance Requirement",
    severity: "HIGH",
    category: "Compliance Investigation",
    noticeType: "Compliance Query",
    tatDays: 3,
    deadline: "2026-03-08",
    status: "Pending Clarification",
    ownerTeam: "Tech / Compliance",
    businessRisk: false,
    escalated: false,
    summary:
      "Investigation and clarification required on specific VPAs (Virtual Payment Addresses) per NPCI compliance requirement. Clarification needed within 3 days.",
  },
  {
    id: "NPCI-001-E1",
    date: "2026-03-05",
    time: "17:18 IST",
    sender: "Shyam Rao",
    senderTitle: "Internal Escalation",
    subject: "VPA Investigation – ESCALATED (Business at Risk)",
    severity: "CRITICAL",
    category: "Escalation",
    noticeType: "Priority Escalation",
    tatDays: 0,
    deadline: "2026-03-05",
    status: "Urgent – Action Required Today",
    ownerTeam: "Tech / Compliance / CEO",
    businessRisk: true,
    escalated: true,
    summary:
      "Escalation of VPA investigation request. Business is at risk. Immediate update required by end of day. Senior leadership alerted.",
  },
];

function parseCsv(text) {
  const rows = [];
  let row = [], value = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') { value += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      row.push(value); value = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") i++;
      row.push(value); value = "";
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

export async function fetchSheetData() {
  const url = `${SHEET_CSV_URL}&_ts=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`);
  const csv = await res.text();
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error("Empty sheet");
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const statusIdx = headers.indexOf("status");
  const dateIdx = headers.findIndex(h => h.includes("date"));
  if (statusIdx === -1) throw new Error("Status column not found");
  const metrics = [];
  rows.slice(1).forEach(r => {
    const raw = r[statusIdx] || "";
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return; }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    arr.forEach(item => {
      if (!item || typeof item !== "object") return;
      metrics.push({
        date: item.date || r[dateIdx] || "",
        category: item.category || "",
        metric_name: item.metric_name || "",
        metric_value: item.metric_value != null ? String(item.metric_value) : "",
        status: item.status || "",
        summary: item.summary || "",
      });
    });
  });
  if (!metrics.length) throw new Error("No metrics parsed");
  return { source_rows: rows.length - 1, metrics };
}
