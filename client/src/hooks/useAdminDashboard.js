import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

// ─── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = `${API_BASE_URL}/api`;

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };
};

const apiFetch = async (path, options = {}) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// ─── Default operating hours ──────────────────────────────────────────────────
const DEFAULT_HOURS = [
  { day: "Mon", open: "08:00", close: "18:00", active: true },
  { day: "Tue", open: "08:00", close: "18:00", active: true },
  { day: "Wed", open: "08:00", close: "18:00", active: true },
  { day: "Thu", open: "08:00", close: "18:00", active: true },
  { day: "Fri", open: "08:00", close: "17:00", active: true },
  { day: "Sat", open: "09:00", close: "13:00", active: false },
  { day: "Sun", open: "", close: "", active: false },
];

// ─── State shape ──────────────────────────────────────────────────────────────
const initialState = {
  activeSection: "overview",

  // Remote data
  user: null,
  summary: null,
  analytics: null,
  flaggedListings: [],
  flaggedReviews: [],
  users: [],
  facilities: [],

  // Facility edit form (currently selected facility)
  selectedFacilityId: null,
  facilitySettings: {
    name: "",
    location: "",
    slotCapacity: 6,
    isActive: true,
  },
  operatingHours: DEFAULT_HOURS,
  lastSavedAt: null,

  // UI state
  loadingStates: {
    summary: false,
    analytics: false,
    moderation: false,
    users: false,
    facilities: false,
  },
  errors: {},
  savingFacility: false,
  togglingRole: null, // userId currently being updated
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "SET_SECTION":
      return { ...state, activeSection: action.payload };

    case "LOADING":
      return {
        ...state,
        loadingStates: { ...state.loadingStates, [action.key]: true },
        errors: { ...state.errors, [action.key]: null },
      };
    case "LOADED":
      return {
        ...state,
        loadingStates: { ...state.loadingStates, [action.key]: false },
      };
    case "ERROR":
      return {
        ...state,
        loadingStates: { ...state.loadingStates, [action.key]: false },
        errors: { ...state.errors, [action.key]: action.message },
      };

    case "SET_SUMMARY":
      return { ...state, summary: action.payload };

    case "SET_ANALYTICS":
      return { ...state, analytics: action.payload };

    case "SET_MODERATION":
      return {
        ...state,
        flaggedListings: action.payload.flaggedListings,
        flaggedReviews: action.payload.flaggedReviews,
      };

    case "RESOLVE_LISTING":
      return {
        ...state,
        flaggedListings: state.flaggedListings.filter(
          (item) => item.id !== action.id,
        ),
      };

    case "RESOLVE_REVIEW":
      return {
        ...state,
        flaggedReviews: state.flaggedReviews.filter(
          (item) => item.id !== action.id,
        ),
      };

    case "SET_USERS":
      return { ...state, users: action.payload };

    case "TOGGLING_ROLE":
      return { ...state, togglingRole: action.userId };

    case "ROLE_UPDATED": {
      const updated = action.payload;
      return {
        ...state,
        togglingRole: null,
        users: state.users.map((u) =>
          u.id === updated.id ? { ...u, role: updated.role } : u,
        ),
      };
    }

    case "ROLE_ERROR":
      return { ...state, togglingRole: null };

    case "SET_FACILITIES":
      return { ...state, facilities: action.payload };

    case "SET_USER":
      return { ...state, user: action.payload };

    case "SELECT_FACILITY": {
      const fac = action.payload;
      // Normalise operating_hours from DB to the array shape the panel expects
      const hours = normaliseFacilityHours(fac.operating_hours);
      return {
        ...state,
        selectedFacilityId: fac.id,
        facilitySettings: {
          name: fac.name,
          location: fac.location,
          slotCapacity: fac.slot_capacity,
          isActive: fac.is_active,
        },
        operatingHours: hours,
        lastSavedAt: null,
      };
    }

    case "UPDATE_SETTING":
      return {
        ...state,
        facilitySettings: {
          ...state.facilitySettings,
          [action.field]: action.value,
        },
      };

    case "UPDATE_HOURS":
      return {
        ...state,
        operatingHours: state.operatingHours.map((entry) =>
          entry.day === action.day
            ? { ...entry, [action.field]: action.value }
            : entry,
        ),
      };

    case "SAVING_FACILITY":
      return { ...state, savingFacility: true };

    case "FACILITY_SAVED":
      return {
        ...state,
        savingFacility: false,
        lastSavedAt: new Date(),
        facilities: state.facilities.map((f) =>
          f.id === action.payload.id ? action.payload : f,
        ),
      };

    case "FACILITY_SAVE_ERROR":
      return { ...state, savingFacility: false };

    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normaliseFacilityHours(raw) {
  if (!raw) return DEFAULT_HOURS;

  if (Array.isArray(raw)) {
    // Already in array shape: [{day, open, close, active}]
    return raw.map((entry) => ({
      day: entry.day ?? "Unknown",
      open: entry.open ?? "",
      close: entry.close ?? "",
      active: Boolean(entry.active),
    }));
  }

  if (typeof raw === "object") {
    // Object shape: { mon: { open, close }, ... }
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const keyMap = Object.fromEntries(
      Object.keys(raw).map((k) => [k.toLowerCase().slice(0, 3), k]),
    );
    return dayOrder.map((day) => {
      const key = keyMap[day.toLowerCase()];
      const val = key ? raw[key] : null;
      return {
        day,
        open: val?.open ?? "",
        close: val?.close ?? "",
        active: Boolean(val?.active ?? !!val?.open),
      };
    });
  }

  return DEFAULT_HOURS;
}

// ─── CSV / PDF helpers (unchanged from original) ──────────────────────────────
const buildCsv = (rows) => {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatPdfLabel = (value) =>
  String(value ?? "")
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatPdfValue = (value) => {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-ZA").format(value);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value ?? "N/A");
};

const buildPdfMetricCards = (rows, headers) => {
  const cardData =
    rows.length === 1
      ? headers.map((header) => ({
          label: formatPdfLabel(header),
          value: formatPdfValue(rows[0][header]),
        }))
      : rows.slice(0, 4).map((row) => ({
          label: formatPdfValue(
            row.label ?? row.category ?? row.month ?? "Item",
          ),
          value: formatPdfValue(row.count ?? row.value ?? row.total ?? ""),
        }));

  if (!cardData.length) return "";

  return `
    <section class="metric-grid" aria-label="Report highlights">
      ${cardData
        .map(
          (card) => `
            <article class="metric-card">
              <p>${escapeHtml(card.label)}</p>
              <strong>${escapeHtml(card.value)}</strong>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
};

const buildPdfRows = (rows, headers) =>
  rows
    .map(
      (row) => `
        <tr>
          ${headers
            .map(
              (header) => `<td>${escapeHtml(formatPdfValue(row[header]))}</td>`,
            )
            .join("")}
        </tr>
      `,
    )
    .join("");

const buildPdfTable = ({ rows = [] }) => {
  if (!rows.length) {
    return `
      <p class="empty-state">
        No analytics data is available for this section yet.
      </p>
    `;
  }

  const headers = Object.keys(rows[0]);

  return `
    ${buildPdfMetricCards(rows, headers)}
    <table>
      <thead>
        <tr>
          ${headers
            .map(
              (header) => `<th>${escapeHtml(formatPdfLabel(header))}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>${buildPdfRows(rows, headers)}</tbody>
    </table>
  `;
};

const buildPdfSections = (sections) =>
  sections
    .map(
      (section, index) => `
        <section class="report-section ${index > 0 ? "section-break" : ""}">
          <header class="section-header">
            <h2>${escapeHtml(section.title)}</h2>
            ${
              section.description
                ? `<p>${escapeHtml(section.description)}</p>`
                : ""
            }
          </header>
          ${buildPdfTable(section)}
        </section>
      `,
    )
    .join("");

const openPrintWindow = ({ title, description, rows, sections }) => {
  const reportSections = sections ?? [{ title, description, rows }];
  const hasPrintableRows = reportSections.some(
    (section) => section.rows?.length,
  );

  if (typeof window === "undefined" || !hasPrintableRows) return;
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  const generatedAt = new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const content = sections
    ? buildPdfSections(reportSections)
    : buildPdfTable({ rows });

  popup.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 18mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 28px;
          }
          .report {
            max-width: 920px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          }
          .hero {
            background: linear-gradient(
              135deg,
              #0d1b4b 0%,
              #1c3faa 55%,
              #2563eb 100%
            );
            color: #ffffff;
            padding: 30px 34px;
          }
          .eyebrow {
            margin: 0 0 10px;
            color: #bfdbfe;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.12;
          }
          .description {
            max-width: 680px;
            margin: 12px 0 0;
            color: #dbeafe;
            font-size: 14px;
            line-height: 1.6;
          }
          .generated {
            display: inline-flex;
            margin-top: 20px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
            padding: 8px 12px;
            color: #eff6ff;
            font-size: 12px;
            font-weight: 700;
          }
          .content { padding: 28px 34px 34px; }
          .report-section {
            break-inside: avoid;
            margin-bottom: 30px;
          }
          .report-section:last-child { margin-bottom: 0; }
          .section-break {
            border-top: 1px solid #e2e8f0;
            padding-top: 26px;
          }
          .section-header {
            margin-bottom: 18px;
          }
          .section-header h2 {
            margin: 0;
            color: #0f172a;
            font-size: 20px;
            line-height: 1.25;
          }
          .section-header p {
            max-width: 680px;
            margin: 8px 0 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.55;
          }
          .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 14px;
            margin-bottom: 24px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            background: #f8fafc;
            padding: 16px;
          }
          .metric-card p {
            margin: 0 0 8px;
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .metric-card strong {
            color: #0f172a;
            font-size: 24px;
            line-height: 1;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
          }
          th, td {
            padding: 13px 15px;
            text-align: left;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          tbody tr:nth-child(even) td { background: #f8fafc; }
          tbody tr:last-child td { border-bottom: 0; }
          .footer {
            margin-top: 18px;
            color: #94a3b8;
            font-size: 11px;
          }
          .empty-state {
            border: 1px dashed #cbd5e1;
            border-radius: 18px;
            background: #f8fafc;
            color: #64748b;
            margin: 0;
            padding: 18px;
            font-size: 13px;
          }
          @media print {
            body { background: #ffffff; padding: 0; }
            .report { box-shadow: none; border-radius: 0; border: 0; }
            .hero { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            tbody tr:nth-child(even) td, th, .metric-card {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="hero">
            <p class="eyebrow">UniSquare Admin Analytics</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="description">${escapeHtml(
              description ||
                "A snapshot of marketplace activity exported from the admin dashboard.",
            )}</p>
            <p class="generated">Generated ${escapeHtml(generatedAt)}</p>
          </header>
          <section class="content">
            ${content}
            <p class="footer">Prepared automatically from live admin dashboard data.</p>
          </section>
        </main>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export default function useAdminDashboard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    dispatch({ type: "LOADING", key: "summary" });
    try {
      const data = await apiFetch("/admin/summary");
      if (!isMounted.current) return;
      dispatch({ type: "SET_SUMMARY", payload: data });
    } catch (err) {
      if (!isMounted.current) return;
      dispatch({ type: "ERROR", key: "summary", message: err.message });
    } finally {
      if (isMounted.current) dispatch({ type: "LOADED", key: "summary" });
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    dispatch({ type: "LOADING", key: "analytics" });
    try {
      const data = await apiFetch("/admin/analytics");
      if (!isMounted.current) return;
      dispatch({ type: "SET_ANALYTICS", payload: data });
    } catch (err) {
      if (!isMounted.current) return;
      dispatch({ type: "ERROR", key: "analytics", message: err.message });
    } finally {
      if (isMounted.current) dispatch({ type: "LOADED", key: "analytics" });
    }
  }, []);

  const fetchModeration = useCallback(async () => {
    dispatch({ type: "LOADING", key: "moderation" });
    try {
      const data = await apiFetch("/admin/moderation");
      if (!isMounted.current) return;
      dispatch({ type: "SET_MODERATION", payload: data });
    } catch (err) {
      if (!isMounted.current) return;
      dispatch({ type: "ERROR", key: "moderation", message: err.message });
    } finally {
      if (isMounted.current) dispatch({ type: "LOADED", key: "moderation" });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    dispatch({ type: "LOADING", key: "users" });
    try {
      const data = await apiFetch("/admin/users");
      if (!isMounted.current) return;
      dispatch({ type: "SET_USERS", payload: data });
    } catch (err) {
      if (!isMounted.current) return;
      dispatch({ type: "ERROR", key: "users", message: err.message });
    } finally {
      if (isMounted.current) dispatch({ type: "LOADED", key: "users" });
    }
  }, []);

  const fetchFacilities = useCallback(async () => {
    dispatch({ type: "LOADING", key: "facilities" });
    try {
      const data = await apiFetch("/admin/facilities");
      if (!isMounted.current) return;
      dispatch({ type: "SET_FACILITIES", payload: data });
      // Auto-select first facility if none selected
      if (data.length > 0) {
        dispatch({ type: "SELECT_FACILITY", payload: data[0] });
      }
    } catch (err) {
      if (!isMounted.current) return;
      dispatch({ type: "ERROR", key: "facilities", message: err.message });
    } finally {
      if (isMounted.current) dispatch({ type: "LOADED", key: "facilities" });
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const authUser = data.session.user;
      const metadata = authUser.user_metadata ?? {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        authUser.email?.split("@")[0] ||
        "Admin";

      const userData = {
        name: authUser.email?.split("@")[0] || "Admin",
        fullName,
        id: authUser.id,
        email: authUser.email,
        role: "administrator",
        provider: authUser.app_metadata?.provider || "google",
        createdAt: authUser.created_at,
        lastSignInAt: authUser.last_sign_in_at,
        avatarUrl: metadata.avatar_url || metadata.picture || null,
      };

      if (isMounted.current) {
        dispatch({ type: "SET_USER", payload: userData });
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }, []);

  // Bootstrap all data on mount
  useEffect(() => {
    fetchSummary();
    fetchAnalytics();
    fetchModeration();
    fetchUsers();
    fetchFacilities();
    fetchUser();
  }, [
    fetchSummary,
    fetchAnalytics,
    fetchModeration,
    fetchUsers,
    fetchFacilities,
    fetchUser,
  ]);

  // ── Derived nav items ──────────────────────────────────────────────────────
  const pendingModerationCount =
    state.flaggedListings.length + state.flaggedReviews.length;

  const navItems = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "facility", label: "Facility" },
      { id: "moderation", label: "Moderation", badge: pendingModerationCount },
      { id: "analytics", label: "Analytics" },
      { id: "users", label: "Users" },
      { id: "settings", label: "Settings" },
      { id: "profile", label: "Profile" },
    ],
    [pendingModerationCount],
  );

  // ── Summary cards ──────────────────────────────────────────────────────────
  const summaryCards = useMemo(() => {
    const s = state.summary;
    if (!s) {
      return [
        { title: "Active Listings", value: "—", trend: "Loading…" },
        { title: "Pending Moderation", value: "—", trend: "Loading…" },
        { title: "Facility Utilisation", value: "—", trend: "Loading…" },
        { title: "Transactions (30d)", value: "—", trend: "Loading…" },
      ];
    }
    return [
      {
        title: "Active Listings",
        value: String(s.activeListings),
        trend: "Currently live on the platform",
      },
      {
        title: "Pending Moderation",
        value: String(s.pendingModeration),
        trend: s.pendingModeration > 0 ? "Needs review" : "All clear",
      },
      {
        title: "Facility Utilisation",
        value: `${s.utilizationPct}%`,
        trend: `${s.utilizationBooked}/${s.utilizationCapacity} slots booked`,
      },
      {
        title: "Transactions (30d)",
        value: String(s.transactions30d),
        trend: "Completed in the last 30 days",
      },
    ];
  }, [state.summary]);

  // ── Analytics object passed to AnalyticsPanel ─────────────────────────────
  const analytics = useMemo(() => {
    if (!state.analytics) {
      return {
        popularCategories: [],
        transactionsOverTime: [],
        facilityUtilization: { booked: 0, capacity: 0 },
        flaggedSummary: { listings: 0, reviews: 0, messages: 0 },
      };
    }
    return state.analytics;
  }, [state.analytics]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setActiveSection = useCallback((id) => {
    dispatch({ type: "SET_SECTION", payload: id });
  }, []);

  const updateFacilitySetting = useCallback((field, value) => {
    dispatch({ type: "UPDATE_SETTING", field, value });
  }, []);

  const updateOperatingHours = useCallback((day, field, value) => {
    dispatch({ type: "UPDATE_HOURS", day, field, value });
  }, []);

  const saveFacilitySettings = useCallback(async () => {
    dispatch({ type: "SAVING_FACILITY" });
    try {
      const payload = {
        ...state.facilitySettings,
        operatingHours: state.operatingHours,
        id: state.selectedFacilityId,
      };

      const method = state.selectedFacilityId ? "PATCH" : "POST";
      const path = state.selectedFacilityId
        ? `/admin/facilities/${state.selectedFacilityId}`
        : "/admin/facilities";

      const data = await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      dispatch({ type: "FACILITY_SAVED", payload: data });
    } catch (err) {
      dispatch({ type: "FACILITY_SAVE_ERROR" });
      console.error("Failed to save facility settings:", err.message);
    }
  }, [state.facilitySettings, state.operatingHours, state.selectedFacilityId]);

  const selectFacility = useCallback(
    (facilityId) => {
      const fac = state.facilities.find((f) => f.id === facilityId);
      if (fac) dispatch({ type: "SELECT_FACILITY", payload: fac });
    },
    [state.facilities],
  );

  const resolveListingFlag = useCallback(
    async (id) => {
      // Optimistic update
      dispatch({ type: "RESOLVE_LISTING", id });
      try {
        await apiFetch(`/admin/moderation/listings/${id}/resolve`, {
          method: "PATCH",
        });
        // Refresh summary badge
        fetchSummary();
      } catch (err) {
        // Roll back on failure
        fetchModeration();
        console.error("Failed to resolve listing flag:", err.message);
      }
    },
    [fetchModeration, fetchSummary],
  );

  const resolveReviewFlag = useCallback(
    async (id) => {
      dispatch({ type: "RESOLVE_REVIEW", id });
      try {
        await apiFetch(`/admin/moderation/reviews/${id}/resolve`, {
          method: "PATCH",
        });
        fetchSummary();
      } catch (err) {
        fetchModeration();
        console.error("Failed to resolve review flag:", err.message);
      }
    },
    [fetchModeration, fetchSummary],
  );

  const updateUserRole = useCallback(async (userId, newRole, facilityId=null) => {
    dispatch({ type: "TOGGLING_ROLE", userId });
    try {
      const data = await apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole, facilityId }),
      });
      dispatch({ type: "ROLE_UPDATED", payload: data });
    } catch (err) {
      dispatch({ type: "ROLE_ERROR" });
      console.error("Failed to update role:", err.message);
    }
  }, []);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const exportCsv = useCallback(
    (reportId) => {
      const configs = {
        categories: {
          filename: "popular-categories.csv",
          rows: analytics.popularCategories,
        },
        transactions: {
          filename: "transactions-over-time.csv",
          rows: analytics.transactionsOverTime,
        },
        utilization: {
          filename: "facility-utilization.csv",
          rows: [analytics.facilityUtilization],
        },
        moderation: {
          filename: "flagged-content.csv",
          rows: [analytics.flaggedSummary],
        },
      };
      const config = configs[reportId];
      if (!config) return;
      const csv = buildCsv(config.rows);
      if (csv) triggerDownload(config.filename, csv, "text/csv;charset=utf-8;");
    },
    [analytics],
  );

  const exportPdf = useCallback(
    (reportId) => {
      const reportSections = {
        categories: {
          title: "Popular Categories",
          description:
            "Top marketplace categories by listing activity for the selected reporting window.",
          rows: analytics.popularCategories,
        },
        transactions: {
          title: "Transactions Over Time",
          description:
            "Completed marketplace transactions grouped by month for recent platform performance.",
          rows: analytics.transactionsOverTime,
        },
        utilization: {
          title: "Facility Utilisation",
          description:
            "Booked trade facility slots compared with available capacity for the current operating period.",
          rows: [analytics.facilityUtilization],
        },
        moderation: {
          title: "Flagged Content Summary",
          description:
            "Listings, reviews, and messages currently awaiting moderation review.",
          rows: [analytics.flaggedSummary],
        },
      };
      const configs = {
        ...reportSections,
        all: {
          title: "Complete Analytics Report",
          description:
            "A combined report covering category demand, transaction activity, facility utilisation, and flagged content.",
          sections: [
            reportSections.categories,
            reportSections.transactions,
            reportSections.utilization,
            reportSections.moderation,
          ],
        },
      };
      const config = configs[reportId];
      if (config?.rows?.length || config?.sections?.length) {
        openPrintWindow(config);
      }
    },
    [analytics],
  );

  return {
    // Navigation
    navItems,
    activeSection: state.activeSection,
    setActiveSection,

    // User
    user: state.user,

    // Summary
    summaryCards,

    // Facility
    facilities: state.facilities,
    selectedFacilityId: state.selectedFacilityId,
    facilitySettings: state.facilitySettings,
    operatingHours: state.operatingHours,
    lastSavedAt: state.lastSavedAt,
    savingFacility: state.savingFacility,
    updateFacilitySetting,
    updateOperatingHours,
    saveFacilitySettings,
    selectFacility,

    // Moderation
    flaggedListings: state.flaggedListings,
    flaggedReviews: state.flaggedReviews,
    resolveListingFlag,
    resolveReviewFlag,

    // Analytics
    analytics,
    exportCsv,
    exportPdf,

    // Users
    users: state.users,
    togglingRole: state.togglingRole,
    updateUserRole,

    // UI state
    loadingStates: state.loadingStates,
    errors: state.errors,
  };
}
