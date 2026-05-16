import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";
import { STAFF_VIEW_CONTENT } from "../components/staff-dashboard/dashboardData";

const EMPTY_DASHBOARD_DATA = {
  facility: null,
  operatingHours: [],
  slots: [],
  transactions: [],
  activityLog: [],
  metrics: {
    totalCapacity: 0,
    totalBookedSlots: 0,
    fullSlots: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
  },
  selectedDate: "",
};

const buildStaffProfile = (sessionUser) => {
  if (!sessionUser) {
    return null;
  }

  const metadata = sessionUser.user_metadata ?? {};

  return {
    id: sessionUser.id,
    fullName:
      metadata.full_name ||
      metadata.name ||
      sessionUser.email?.split("@")[0] ||
      "Facility Staff",
    email: sessionUser.email || "Unknown email",
    role: metadata.role || "facility_staff",
  };
};

export default function useStaffDashboard() {
  const [activeNav, setActiveNav] = useState("bookings");
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD_DATA);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (requestedDate = "") => {
    setLoading(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const accessToken = session?.access_token;

      setStaffProfile(buildStaffProfile(session?.user));

      if (!accessToken) {
        throw new Error("You must be signed in to view the staff dashboard.");
      }

      const requestUrl = new URL(
        `${API_BASE_URL}/api/facility-dashboard`,
        window.location.origin,
      );

      if (requestedDate) {
        requestUrl.searchParams.set("date", requestedDate);
      }

      const response = await fetch(requestUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load facility dashboard data.",
        );
      }

      setDashboardData({
        facility: result.facility || null,
        operatingHours: result.operatingHours || [],
        slots: result.slots || [],
        transactions: result.transactions || [],
        activityLog: result.activityLog || [],
        metrics: result.metrics || EMPTY_DASHBOARD_DATA.metrics,
        selectedDate: result.selectedDate || "",
      });
    } catch (fetchError) {
      console.error("Failed to fetch staff dashboard data:", fetchError);
      setDashboardData(EMPTY_DASHBOARD_DATA);
      setError(
        fetchError.message || "Unable to load facility dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await fetchDashboard();
    };

    run();
  }, [fetchDashboard]);

  const advanceTransaction = useCallback(
    async (transactionId, action) => {
      setActionLoadingId(transactionId);
      setError("");

      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        if (!accessToken) {
          throw new Error("You must be signed in to update a transaction.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/facility-dashboard/transactions/${transactionId}/actions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              action,
              selectedDate: dashboardData.selectedDate,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || result.message || "Unable to update transaction.",
          );
        }

        setDashboardData({
          facility: result.facility || null,
          operatingHours: result.operatingHours || [],
          slots: result.slots || [],
          transactions: result.transactions || [],
          activityLog: result.activityLog || [],
          metrics: result.metrics || EMPTY_DASHBOARD_DATA.metrics,
          selectedDate: result.selectedDate || "",
        });
      } catch (actionError) {
        console.error("Failed to update facility transaction:", actionError);
        setError(
          actionError.message || "Unable to update facility transaction.",
        );
      } finally {
        setActionLoadingId("");
      }
    },
    [dashboardData.selectedDate],
  );

  const changeSelectedDate = useCallback(
    async (nextDate) => {
      await fetchDashboard(nextDate);
    },
    [fetchDashboard],
  );

  const heroStats = useMemo(
    () => [
      {
        label: "Reserved slots",
        value: dashboardData.metrics.totalBookedSlots,
        sub: `${dashboardData.metrics.fullSlots} full windows`,
      },
      {
        label: "Pending handoffs",
        value: dashboardData.metrics.pendingTransactions,
        sub: `${dashboardData.metrics.completedTransactions} completed today`,
      },
    ],
    [dashboardData.metrics],
  );

  const transactionQueue = useMemo(
    () =>
      dashboardData.transactions.filter(
        (transaction) => transaction.stage !== "complete",
      ),
    [dashboardData.transactions],
  );

  const confirmedTransactionQueue = useMemo(
    () =>
      dashboardData.transactions.filter(
        (transaction) => transaction.stage === "complete",
      ),
    [dashboardData.transactions],
  );

  const viewContent =
    STAFF_VIEW_CONTENT[activeNav] || STAFF_VIEW_CONTENT.bookings;

  return {
    activeNav,
    setActiveNav,
    viewContent,
    heroStats,
    staffProfile,
    facilityProfile: dashboardData.facility,
    facilityHours: dashboardData.operatingHours,
    todaysBookings: dashboardData.slots,
    totalCapacity: dashboardData.metrics.totalCapacity,
    totalBookedSlots: dashboardData.metrics.totalBookedSlots,
    pendingTransactions: dashboardData.metrics.pendingTransactions,
    fullSlots: dashboardData.metrics.fullSlots,
    transactionQueue,
    confirmedTransactionQueue,
    activityLog: dashboardData.activityLog,
    selectedDate: dashboardData.selectedDate,
    changeSelectedDate,
    advanceTransaction,
    loading,
    error,
    actionLoadingId,
  };
}
