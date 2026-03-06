// Google Sheet data source
export const SHEET_ID = "17hUKu3p78VPnpZQfWXBMwz9GjeT1Dd37TR0ZCUdsPr8";
export const SHEET_NAME = "Sheet2";
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// Fallback static data from NPCI_circulars.xlsx – Sheet2
export const FALLBACK_DATA = {
  source_rows: 1,
  metrics: [
    {
      date: "2026-03-06",
      category: "Regulatory Compliance",
      system: "NPCI",
      metric_name: "VPA Compliance Investigation Status",
      metric_value: "Pending Investigation",
      status: "Critical Priority",
      action_required: "Investigate specified Virtual Payment Addresses (VPAs) regarding a compliance requirement.",
      deadline: "2026-03-08",
      summary: "Investigate specified VPAs regarding a compliance requirement, escalated due to business risk. Originated from Ravi Jain, Sr. Director – Central Data Product. Clarification required within 3 days (March 8, 2026).",
      email_subject: "Re: Test NPCI",
    },
  ],
};

// Enriched notice records (CompSec-style)
export const NOTICES = [
  {
    id: "NPCI-001",
    date: "2026-03-06",
    time: "14:52 IST",
    sender: "Ravi Jain",
    senderTitle: "Sr. Director – Central Data Product",
    subject: "Re: Test NPCI",
    severity: "HIGH",
    category: "Regulatory Compliance",
    system: "NPCI",
    noticeType: "Compliance Query",
    tatDays: 3,
    deadline: "2026-03-08",
    status: "Pending Investigation",
    ownerTeam: "Tech / Compliance",
    businessRisk: false,
    escalated: false,
    actionRequired: "Investigate specified Virtual Payment Addresses (VPAs) regarding a compliance requirement.",
    summary:
      "VPA Compliance Investigation Status is Pending Investigation. Investigate specified VPAs as per NPCI compliance requirement. Clarification required within 3 days.",
  },
  {
    id: "NPCI-001-E1",
    date: "2026-03-06",
    time: "14:52 IST",
    sender: "Shyam Rao",
    senderTitle: "Internal Escalation",
    subject: "Re: Test NPCI – ESCALATED (Business at Risk)",
    severity: "CRITICAL",
    category: "Regulatory Compliance",
    system: "NPCI",
    noticeType: "Priority Escalation",
    tatDays: 0,
    deadline: "2026-03-06",
    status: "Critical Priority",
    ownerTeam: "Tech / Compliance / CEO",
    businessRisk: true,
    escalated: true,
    actionRequired: "Immediate investigation and status update required. Business at risk.",
    summary:
      "Escalation of VPA investigation request. Business is at risk. Immediate update required today. Senior leadership alerted.",
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

// Column name → field key mapping for Sheet2
const COL_MAP = {
  "date": "date",
  "alert type": "category",
  "system": "system",
  "metric name": "metric_name",
  "metric value": "metric_value",
  "status": "status",
  "action required": "action_required",
  "deadline": "deadline",
  "summary": "summary",
  "email subject": "email_subject",
};

export async function fetchSheetData() {
  const url = `${SHEET_CSV_URL}&_ts=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`);
  const csv = await res.text();
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error("Empty sheet");
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const metrics = [];
  rows.slice(1).forEach(r => {
    const item = {};
    headers.forEach((h, i) => {
      const key = COL_MAP[h];
      if (key) item[key] = (r[i] || "").trim();
    });
    if (!item.metric_name && !item.system) return;
    metrics.push({
      date: item.date || "",
      category: item.category || "",
      system: item.system || "",
      metric_name: item.metric_name || "",
      metric_value: item.metric_value || "",
      status: item.status || "",
      action_required: item.action_required || "",
      deadline: item.deadline || "",
      summary: item.summary || "",
      email_subject: item.email_subject || "",
    });
  });
  if (!metrics.length) throw new Error("No metrics parsed");
  return { source_rows: rows.length - 1, metrics };
}
