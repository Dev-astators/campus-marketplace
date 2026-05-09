import { useMemo, useState } from "react";

const INITIAL_OPERATING_HOURS = [
  { day: "Mon", open: "08:00", close: "18:00", active: true },
  { day: "Tue", open: "08:00", close: "18:00", active: true },
  { day: "Wed", open: "08:00", close: "18:00", active: true },
  { day: "Thu", open: "08:00", close: "18:00", active: true },
  { day: "Fri", open: "08:00", close: "17:00", active: true },
  { day: "Sat", open: "09:00", close: "13:00", active: false },
  { day: "Sun", open: "", close: "", active: false },
];

const INITIAL_FLAGGED_LISTINGS = [
  {
    id: "L-102",
    title: "Calculus Textbook",
    reason: "Potential counterfeit",
    reportedBy: "Student 284",
  },
  {
    id: "L-118",
    title: "Gaming Laptop",
    reason: "Suspicious pricing",
    reportedBy: "System",
  },
];

const INITIAL_FLAGGED_REVIEWS = [
  {
    id: "R-21",
    listing: "Desk Lamp",
    reason: "Abusive language",
    reportedBy: "Student 109",
  },
  {
    id: "R-34",
    listing: "Physics Notes",
    reason: "Personal info shared",
    reportedBy: "System",
  },
];

const POPULAR_CATEGORIES = [
  { label: "Textbooks", count: 42 },
  { label: "Electronics", count: 31 },
  { label: "Furniture", count: 18 },
  { label: "Clothing", count: 12 },
];

const TRANSACTIONS_OVER_TIME = [
  { label: "Jan", count: 24 },
  { label: "Feb", count: 29 },
  { label: "Mar", count: 36 },
  { label: "Apr", count: 41 },
];

const buildCsv = (rows) => {
  if (!rows || rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escapeValue = (value) => {
    const stringValue = String(value ?? "");
    if (stringValue.includes(",") || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeValue(row[header])).join(","));
  }

  return lines.join("\n");
};

const triggerDownload = (filename, content, mimeType) => {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const openPrintWindow = (title, rows) => {
  if (typeof window === "undefined") return;
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${Object.values(row)
          .map((value) => `<td>${value ?? ""}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>${Object.keys(rows[0] || {})
              .map((key) => `<th>${key}</th>`)
              .join("")}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
};

export default function useAdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [facilitySettings, setFacilitySettings] = useState({
    name: "University Square",
    location: "Wits Central Campus",
    slotCapacity: 6,
    isActive: true,
  });
  const [operatingHours, setOperatingHours] = useState(INITIAL_OPERATING_HOURS);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [flaggedListings, setFlaggedListings] = useState(
    INITIAL_FLAGGED_LISTINGS,
  );
  const [flaggedReviews, setFlaggedReviews] = useState(INITIAL_FLAGGED_REVIEWS);

  const pendingModerationCount = flaggedListings.length + flaggedReviews.length;

  const navItems = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "facility", label: "Facility" },
      { id: "moderation", label: "Moderation", badge: pendingModerationCount },
      { id: "analytics", label: "Analytics" },
      { id: "settings", label: "Settings" },
    ],
    [pendingModerationCount],
  );

  const utilizationCapacity =
    facilitySettings.slotCapacity * operatingHours.length;
  const utilizationBooked = Math.round(utilizationCapacity * 0.72);

  const summaryCards = useMemo(
    () => [
      {
        title: "Active Listings",
        value: "128",
        trend: "+6% vs last week",
      },
      {
        title: "Pending Moderation",
        value: String(pendingModerationCount),
        trend: pendingModerationCount ? "Needs review" : "All clear",
      },
      {
        title: "Facility Utilization",
        value: `${Math.round((utilizationBooked / utilizationCapacity) * 100)}%`,
        trend: `${utilizationBooked}/${utilizationCapacity} slots booked`,
      },
      {
        title: "Transactions (30d)",
        value: "214",
        trend: "Stable trend",
      },
    ],
    [pendingModerationCount, utilizationBooked, utilizationCapacity],
  );

  const analytics = useMemo(
    () => ({
      popularCategories: POPULAR_CATEGORIES,
      transactionsOverTime: TRANSACTIONS_OVER_TIME,
      facilityUtilization: {
        booked: utilizationBooked,
        capacity: utilizationCapacity,
      },
      flaggedSummary: {
        listings: flaggedListings.length,
        reviews: flaggedReviews.length,
        messages: 1,
      },
    }),
    [
      flaggedListings.length,
      flaggedReviews.length,
      utilizationBooked,
      utilizationCapacity,
    ],
  );

  const updateFacilitySetting = (field, value) => {
    setFacilitySettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateOperatingHours = (day, field, value) => {
    setOperatingHours((prev) =>
      prev.map((entry) =>
        entry.day === day ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const saveFacilitySettings = () => {
    setLastSavedAt(new Date());
  };

  const resolveListingFlag = (id) => {
    setFlaggedListings((prev) => prev.filter((item) => item.id !== id));
  };

  const resolveReviewFlag = (id) => {
    setFlaggedReviews((prev) => prev.filter((item) => item.id !== id));
  };

  const exportCsv = (reportId) => {
    const reportConfig = {
      categories: {
        filename: "popular-categories.csv",
        rows: POPULAR_CATEGORIES,
      },
      transactions: {
        filename: "transactions-over-time.csv",
        rows: TRANSACTIONS_OVER_TIME,
      },
      utilization: {
        filename: "facility-utilization.csv",
        rows: [
          {
            booked: utilizationBooked,
            capacity: utilizationCapacity,
          },
        ],
      },
      moderation: {
        filename: "flagged-content.csv",
        rows: [
          {
            listings: flaggedListings.length,
            reviews: flaggedReviews.length,
            messages: 1,
          },
        ],
      },
    };

    const config = reportConfig[reportId];
    if (!config) return;

    const csv = buildCsv(config.rows);
    if (!csv) return;

    triggerDownload(config.filename, csv, "text/csv;charset=utf-8;");
  };

  const exportPdf = (reportId) => {
    const reportConfig = {
      categories: {
        title: "Popular Categories",
        rows: POPULAR_CATEGORIES,
      },
      transactions: {
        title: "Transactions Over Time",
        rows: TRANSACTIONS_OVER_TIME,
      },
      utilization: {
        title: "Facility Utilization",
        rows: [
          {
            booked: utilizationBooked,
            capacity: utilizationCapacity,
          },
        ],
      },
      moderation: {
        title: "Flagged Content Summary",
        rows: [
          {
            listings: flaggedListings.length,
            reviews: flaggedReviews.length,
            messages: 1,
          },
        ],
      },
    };

    const config = reportConfig[reportId];
    if (!config || config.rows.length === 0) return;

    openPrintWindow(config.title, config.rows);
  };

  return {
    navItems,
    activeSection,
    setActiveSection,
    summaryCards,
    facilitySettings,
    operatingHours,
    lastSavedAt,
    updateFacilitySetting,
    updateOperatingHours,
    saveFacilitySettings,
    flaggedListings,
    flaggedReviews,
    resolveListingFlag,
    resolveReviewFlag,
    analytics,
    exportCsv,
    exportPdf,
  };
}
