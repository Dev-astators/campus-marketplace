import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { supabase } from "../config/supabaseClient";

// ─── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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
    return s.includes(",") || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
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

const openPrintWindow = (title, rows) => {
  if (typeof window === "undefined" || !rows.length) return;
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  const headers = Object.keys(rows[0]);
  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f4f4f4; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
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
    return () => { isMounted.current = false; };
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

  // Bootstrap all data on mount
  useEffect(() => {
    fetchSummary();
    fetchAnalytics();
    fetchModeration();
    fetchUsers();
    fetchFacilities();
  }, [fetchSummary, fetchAnalytics, fetchModeration, fetchUsers, fetchFacilities]);

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
  }, [
    state.facilitySettings,
    state.operatingHours,
    state.selectedFacilityId,
  ]);

  const selectFacility = useCallback(
    (facilityId) => {
      const fac = state.facilities.find((f) => f.id === facilityId);
      if (fac) dispatch({ type: "SELECT_FACILITY", payload: fac });
    },
    [state.facilities],
  );

  const resolveListingFlag = useCallback(async (id) => {
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
  }, [fetchModeration, fetchSummary]);

  const resolveReviewFlag = useCallback(async (id) => {
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
  }, [fetchModeration, fetchSummary]);

  const updateUserRole = useCallback(async (userId, newRole) => {
    dispatch({ type: "TOGGLING_ROLE", userId });
    try {
      const data = await apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
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
      const configs = {
        categories: { title: "Popular Categories", rows: analytics.popularCategories },
        transactions: { title: "Transactions Over Time", rows: analytics.transactionsOverTime },
        utilization: { title: "Facility Utilisation", rows: [analytics.facilityUtilization] },
        moderation: { title: "Flagged Content Summary", rows: [analytics.flaggedSummary] },
      };
      const config = configs[reportId];
      if (config?.rows?.length) openPrintWindow(config.title, config.rows);
    },
    [analytics],
  );

  return {
    // Navigation
    navItems,
    activeSection: state.activeSection,
    setActiveSection,

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