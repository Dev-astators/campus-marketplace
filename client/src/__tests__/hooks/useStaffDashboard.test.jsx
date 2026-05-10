import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../config/supabaseClient";
import useStaffDashboard from "../../hooks/useStaffDashboard";

function HookHarness() {
  const {
    activeNav,
    setActiveNav,
    viewContent,
    heroStats,
    staffProfile,
    facilityProfile,
    todaysBookings,
    transactionQueue,
    activityLog,
    selectedDate,
    advanceTransaction,
    loading,
    error,
    actionLoadingId,
  } = useStaffDashboard();

  return (
    <section>
      <p data-testid="active-nav">{activeNav}</p>
      <p data-testid="view-title">{viewContent.title}</p>
      <p data-testid="staff-name">{staffProfile?.fullName || ""}</p>
      <p data-testid="staff-role">{staffProfile?.role || ""}</p>
      <p data-testid="facility-name">{facilityProfile?.name || ""}</p>
      <p data-testid="booking-count">{todaysBookings.length}</p>
      <p data-testid="transaction-count">{transactionQueue.length}</p>
      <p data-testid="activity-count">{activityLog.length}</p>
      <p data-testid="selected-date">{selectedDate}</p>
      <p data-testid="reserved-slots">{heroStats[0]?.value ?? ""}</p>
      <p data-testid="pending-handoffs">{heroStats[1]?.value ?? ""}</p>
      <p data-testid="loading-state">{loading ? "loading" : "idle"}</p>
      <p data-testid="error-message">{error}</p>
      <p data-testid="action-loading-id">{actionLoadingId}</p>

      <button
        type="button"
        onClick={() => setActiveNav("verification")}
      >
        Show verification
      </button>

      <button
        type="button"
        onClick={() => advanceTransaction("TX-204", "confirm_dropoff")}
      >
        Advance transaction
      </button>
    </section>
  );
}

const buildSession = (overrides = {}) => ({
  data: {
    session: {
      access_token: "staff-token",
      user: {
        id: "staff-1",
        email: "staff@wits.ac.za",
        user_metadata: {
          full_name: "Karabo Tlaka",
          role: "facility_staff",
        },
        ...overrides.user,
      },
      ...overrides.session,
    },
  },
});

const initialDashboard = {
  facility: {
    name: "Braamfontein Trade Facility",
  },
  operatingHours: [{ day: "Monday", open: "08:00", close: "18:00" }],
  slots: [{ id: "slot-1" }],
  transactions: [{ id: "TX-204" }],
  activityLog: [{ id: "activity-1" }],
  metrics: {
    totalCapacity: 10,
    totalBookedSlots: 6,
    fullSlots: 1,
    pendingTransactions: 2,
    completedTransactions: 1,
  },
  selectedDate: "2026-05-10",
};

const updatedDashboard = {
  ...initialDashboard,
  transactions: [],
  metrics: {
    ...initialDashboard.metrics,
    pendingTransactions: 1,
    completedTransactions: 2,
  },
};

describe("useStaffDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("loads the staff dashboard with live facility data", async () => {
    const user = userEvent.setup();

    supabase.auth.getSession.mockResolvedValue(buildSession());
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => initialDashboard,
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("facility-name")).toHaveTextContent(
        "Braamfontein Trade Facility",
      );
    });

    expect(screen.getByTestId("staff-name")).toHaveTextContent("Karabo Tlaka");
    expect(screen.getByTestId("staff-role")).toHaveTextContent(
      "facility_staff",
    );
    expect(screen.getByTestId("booking-count")).toHaveTextContent("1");
    expect(screen.getByTestId("transaction-count")).toHaveTextContent("1");
    expect(screen.getByTestId("activity-count")).toHaveTextContent("1");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-05-10",
    );
    expect(screen.getByTestId("reserved-slots")).toHaveTextContent("6");
    expect(screen.getByTestId("pending-handoffs")).toHaveTextContent("2");
    expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/facility-dashboard"),
      {
        headers: {
          Authorization: "Bearer staff-token",
        },
      },
    );

    await user.click(
      screen.getByRole("button", { name: /show verification/i }),
    );

    expect(screen.getByTestId("active-nav")).toHaveTextContent("verification");
    expect(screen.getByTestId("view-title")).toHaveTextContent(
      "Staff handoff controls",
    );
  });

  it("shows an error when the session has no access token", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue(
      buildSession({
        session: {
          access_token: "",
        },
      }),
    );

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "You must be signed in to view the staff dashboard.",
      );
    });

    expect(screen.getByTestId("staff-name")).toHaveTextContent("Karabo Tlaka");
    expect(screen.getByTestId("transaction-count")).toHaveTextContent("0");
    expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
    expect(global.fetch).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("posts transaction actions and refreshes dashboard data", async () => {
    const user = userEvent.setup();
    let resolveActionRequest;

    supabase.auth.getSession.mockResolvedValue(buildSession());
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialDashboard,
      })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveActionRequest = resolve;
        }),
      );

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-count")).toHaveTextContent("1");
    });

    await user.click(
      screen.getByRole("button", { name: /advance transaction/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("action-loading-id")).toHaveTextContent(
        "TX-204",
      );
    });

    resolveActionRequest({
      ok: true,
      json: async () => updatedDashboard,
    });

    await waitFor(() => {
      expect(screen.getByTestId("transaction-count")).toHaveTextContent("0");
      expect(screen.getByTestId("pending-handoffs")).toHaveTextContent("1");
      expect(screen.getByTestId("action-loading-id")).toBeEmptyDOMElement();
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining(
        "/api/facility-dashboard/transactions/TX-204/actions",
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer staff-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ action: "confirm_dropoff" }),
      }),
    );
  });

  it("surfaces transaction action errors when auth is unavailable", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    supabase.auth.getSession
      .mockResolvedValueOnce(buildSession())
      .mockResolvedValueOnce(
        buildSession({
          session: {
            access_token: "",
          },
        }),
      );

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => initialDashboard,
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-count")).toHaveTextContent("1");
    });

    await user.click(
      screen.getByRole("button", { name: /advance transaction/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "You must be signed in to update a transaction.",
      );
      expect(screen.getByTestId("action-loading-id")).toBeEmptyDOMElement();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
