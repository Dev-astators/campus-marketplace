import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import { supabase } from "../../config/supabaseClient";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

function AdminDashboardHarness() {
  const { summaryCards, navItems, users, updateUserRole, facilitySettings } =
    useAdminDashboard();

  const moderationBadge =
    navItems.find((item) => item.id === "moderation")?.badge ?? 0;

  return (
    <section>
      <p data-testid="summary">{summaryCards[0]?.value}</p>
      <p data-testid="moderation">{moderationBadge}</p>
      <p data-testid="facility">{facilitySettings.name}</p>
      <p data-testid="role">{users[0]?.role || ""}</p>
      <button type="button" onClick={() => updateUserRole("user-1", "admin")}>
        Promote
      </button>
    </section>
  );
}

function AdminDashboardActionsHarness() {
  const dashboard = useAdminDashboard();
  const {
    activeSection,
    setActiveSection,
    user,
    summaryCards,
    navItems,
    facilities,
    selectedFacilityId,
    facilitySettings,
    operatingHours,
    lastSavedAt,
    savingFacility,
    updateFacilitySetting,
    updateOperatingHours,
    saveFacilitySettings,
    selectFacility,
    flaggedListings,
    flaggedReviews,
    resolveListingFlag,
    resolveReviewFlag,
    analytics,
    exportCsv,
    exportPdf,
    users,
    togglingRole,
    updateUserRole,
    loadingStates,
    errors,
  } = dashboard;

  const moderationBadge =
    navItems.find((item) => item.id === "moderation")?.badge ?? 0;
  const firstHours = operatingHours[0]
    ? `${operatingHours[0].day}:${operatingHours[0].open}:${operatingHours[0].close}:${String(
        operatingHours[0].active,
      )}`
    : "";

  return (
    <section>
      <p data-testid="active-section">{activeSection}</p>
      <p data-testid="user-name">{user?.fullName || ""}</p>
      <p data-testid="summary-value">{summaryCards[0]?.value}</p>
      <p data-testid="summary-trend">{summaryCards[1]?.trend}</p>
      <p data-testid="moderation-badge">{moderationBadge}</p>
      <p data-testid="facility-count">{facilities.length}</p>
      <p data-testid="selected-facility">{selectedFacilityId || ""}</p>
      <p data-testid="facility-name">{facilitySettings.name}</p>
      <p data-testid="first-hours">{firstHours}</p>
      <p data-testid="saved-state">
        {savingFacility ? "saving" : lastSavedAt ? "saved" : "idle"}
      </p>
      <p data-testid="listing-count">{flaggedListings.length}</p>
      <p data-testid="review-count">{flaggedReviews.length}</p>
      <p data-testid="category-count">{analytics.popularCategories.length}</p>
      <p data-testid="role">{users[0]?.role || ""}</p>
      <p data-testid="toggling-role">{togglingRole || ""}</p>
      <p data-testid="summary-loading">{String(loadingStates.summary)}</p>
      <p data-testid="summary-error">{errors.summary || ""}</p>
      <p data-testid="users-error">{errors.users || ""}</p>

      <button type="button" onClick={() => setActiveSection("users")}>
        Show users
      </button>
      <button type="button" onClick={() => selectFacility("fac-2")}>
        Select annex
      </button>
      <button
        type="button"
        onClick={() => updateFacilitySetting("name", "Edited Facility")}
      >
        Rename facility
      </button>
      <button
        type="button"
        onClick={() => updateOperatingHours("Fri", "close", "16:00")}
      >
        Update Friday
      </button>
      <button type="button" onClick={saveFacilitySettings}>
        Save facility
      </button>
      <button type="button" onClick={() => resolveListingFlag("listing-1")}>
        Resolve listing
      </button>
      <button type="button" onClick={() => resolveReviewFlag("review-1")}>
        Resolve review
      </button>
      <button
        type="button"
        onClick={() => updateUserRole("user-1", "facility_staff", "fac-2")}
      >
        Make staff
      </button>
      <button type="button" onClick={() => exportCsv("categories")}>
        Export categories CSV
      </button>
      <button type="button" onClick={() => exportCsv("missing")}>
        Export missing CSV
      </button>
      <button type="button" onClick={() => exportPdf("transactions")}>
        Export transactions PDF
      </button>
      <button type="button" onClick={() => exportPdf("all")}>
        Export all PDF
      </button>
      <button type="button" onClick={() => exportPdf("missing")}>
        Export missing PDF
      </button>
    </section>
  );
}

describe("useAdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });

    global.fetch = jest.fn((url) => {
      if (url.includes("/admin/summary")) {
        return createFetchResponse({
          activeListings: 4,
          pendingModeration: 1,
          utilizationPct: 70,
          utilizationBooked: 7,
          utilizationCapacity: 10,
          transactions30d: 5,
        });
      }
      if (url.includes("/admin/analytics")) {
        return createFetchResponse({
          popularCategories: [{ label: "Tech", count: 2 }],
          transactionsOverTime: [],
          facilityUtilization: { booked: 3, capacity: 10 },
          flaggedSummary: { listings: 1, reviews: 0, messages: 0 },
        });
      }
      if (url.includes("/admin/moderation")) {
        return createFetchResponse({
          flaggedListings: [{ id: "listing-1" }],
          flaggedReviews: [],
        });
      }
      if (url.includes("/admin/users/") && url.includes("/role")) {
        return createFetchResponse({ id: "user-1", role: "admin" });
      }
      if (url.includes("/admin/users")) {
        return createFetchResponse([
          { id: "user-1", full_name: "Ada", role: "student" },
        ]);
      }
      if (url.includes("/admin/facilities")) {
        return createFetchResponse([
          {
            id: "fac-1",
            name: "Main Facility",
            location: "Campus",
            slot_capacity: 6,
            is_active: true,
            operating_hours: [],
          },
        ]);
      }

      return createFetchResponse({});
    });
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("loads data and updates roles", async () => {
    const user = userEvent.setup();

    render(<AdminDashboardHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("summary")).toHaveTextContent("4");
    });

    await waitFor(() => {
      expect(screen.getByTestId("moderation")).toHaveTextContent("1");
    });

    await waitFor(() => {
      expect(screen.getByTestId("facility")).toHaveTextContent("Main Facility");
    });

    await user.click(screen.getByRole("button", { name: /promote/i }));

    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("admin");
    });
  });

  it("edits facilities, resolves moderation, and exports analytics", async () => {
    const user = userEvent.setup();
    URL.createObjectURL = URL.createObjectURL || jest.fn();
    URL.revokeObjectURL = URL.revokeObjectURL || jest.fn();
    const anchorClickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const createObjectUrlSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:admin-report");
    const revokeObjectUrlSpy = jest
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const popup = {
      document: {
        write: jest.fn(),
        close: jest.fn(),
      },
      focus: jest.fn(),
      print: jest.fn(),
    };
    const openSpy = jest.spyOn(window, "open").mockReturnValue(popup);

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
          user: {
            id: "admin-1",
            email: "admin@example.com",
            created_at: "2026-01-01T00:00:00.000Z",
            last_sign_in_at: "2026-05-01T00:00:00.000Z",
            user_metadata: {
              name: "Admin Person",
              avatar_url: "https://example.com/avatar.png",
            },
            app_metadata: { provider: "email" },
          },
        },
      },
    });

    global.fetch = jest.fn((url, options = {}) => {
      if (url.includes("/admin/summary")) {
        return createFetchResponse({
          activeListings: 12,
          pendingModeration: 0,
          utilizationPct: 80,
          utilizationBooked: 8,
          utilizationCapacity: 10,
          transactions30d: 9,
        });
      }

      if (url.includes("/admin/analytics")) {
        return createFetchResponse({
          popularCategories: [
            { label: "Books, Notes", count: 3 },
            { label: "Tech", count: 2 },
          ],
          transactionsOverTime: [{ label: "May", count: 4 }],
          facilityUtilization: { booked: 8, capacity: 10 },
          flaggedSummary: { listings: 0, reviews: 0, messages: 1 },
        });
      }

      if (url.includes("/admin/moderation/listings/listing-1/resolve")) {
        return createFetchResponse({ ok: true });
      }

      if (url.includes("/admin/moderation/reviews/review-1/resolve")) {
        return createFetchResponse({ ok: true });
      }

      if (url.includes("/admin/moderation")) {
        return createFetchResponse({
          flaggedListings: [{ id: "listing-1", title: "Flagged listing" }],
          flaggedReviews: [{ id: "review-1", listing: "Desk lamp" }],
        });
      }

      if (url.includes("/admin/users/user-1/role")) {
        return createFetchResponse({ id: "user-1", role: "facility_staff" });
      }

      if (url.includes("/admin/users")) {
        return createFetchResponse([
          { id: "user-1", full_name: "Ada", role: "student" },
        ]);
      }

      if (
        url.includes("/admin/facilities/fac-2") &&
        options.method === "PATCH"
      ) {
        return createFetchResponse({
          id: "fac-2",
          name: "Edited Facility",
          location: "West Campus",
          slot_capacity: 9,
          is_active: false,
          operating_hours: [
            { day: "Fri", open: "09:00", close: "16:00", active: true },
          ],
        });
      }

      if (url.includes("/admin/facilities")) {
        return createFetchResponse([
          {
            id: "fac-1",
            name: "Main Facility",
            location: "East Campus",
            slot_capacity: 6,
            is_active: true,
            operating_hours: {
              Monday: { open: "07:30", close: "17:00", active: true },
              Sunday: { open: "", close: "", active: false },
            },
          },
          {
            id: "fac-2",
            name: "Annex Facility",
            location: "West Campus",
            slot_capacity: 8,
            is_active: false,
            operating_hours: [
              { day: "Fri", open: "09:00", close: null, active: 1 },
            ],
          },
        ]);
      }

      return createFetchResponse({});
    });

    render(<AdminDashboardActionsHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("summary-value")).toHaveTextContent("12");
    });
    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("Admin Person");
    });

    expect(screen.getByTestId("summary-trend")).toHaveTextContent("All clear");
    expect(screen.getByTestId("moderation-badge")).toHaveTextContent("2");
    expect(screen.getByTestId("first-hours")).toHaveTextContent(
      "Mon:07:30:17:00:true",
    );

    await user.click(screen.getByRole("button", { name: /show users/i }));
    expect(screen.getByTestId("active-section")).toHaveTextContent("users");

    await user.click(screen.getByRole("button", { name: /select annex/i }));
    expect(screen.getByTestId("selected-facility")).toHaveTextContent("fac-2");
    expect(screen.getByTestId("facility-name")).toHaveTextContent(
      "Annex Facility",
    );
    expect(screen.getByTestId("first-hours")).toHaveTextContent(
      "Fri:09:00::true",
    );

    await user.click(screen.getByRole("button", { name: /rename facility/i }));
    await user.click(screen.getByRole("button", { name: /update friday/i }));
    await user.click(screen.getByRole("button", { name: /save facility/i }));

    await waitFor(() => {
      expect(screen.getByTestId("saved-state")).toHaveTextContent("saved");
    });

    const patchCall = global.fetch.mock.calls.find(
      ([url, options]) =>
        url.includes("/admin/facilities/fac-2") && options?.method === "PATCH",
    );
    expect(JSON.parse(patchCall[1].body)).toMatchObject({
      id: "fac-2",
      name: "Edited Facility",
    });

    await user.click(screen.getByRole("button", { name: /resolve listing/i }));
    await waitFor(() => {
      expect(screen.getByTestId("listing-count")).toHaveTextContent("0");
    });

    await user.click(screen.getByRole("button", { name: /resolve review/i }));
    await waitFor(() => {
      expect(screen.getByTestId("review-count")).toHaveTextContent("0");
    });

    await user.click(screen.getByRole("button", { name: /make staff/i }));
    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("facility_staff");
    });

    await user.click(
      screen.getByRole("button", { name: /export categories csv/i }),
    );
    await user.click(screen.getByRole("button", { name: /export missing csv/i }));
    await user.click(
      screen.getByRole("button", { name: /export transactions pdf/i }),
    );
    await user.click(screen.getByRole("button", { name: /export all pdf/i }));
    await user.click(screen.getByRole("button", { name: /export missing pdf/i }));

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:admin-report");
    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(popup.document.write).toHaveBeenCalledWith(
      expect.stringContaining("Transactions Over Time"),
    );
    const pdfMarkup = popup.document.write.mock.calls[0][0];
    expect(pdfMarkup).toEqual(
      expect.stringContaining("UniSquare Admin Analytics"),
    );
    expect(pdfMarkup).toEqual(expect.stringContaining("metric-card"));
    expect(pdfMarkup).toEqual(
      expect.stringContaining(
        "Completed marketplace transactions grouped by month",
      ),
    );
    expect(pdfMarkup).toEqual(expect.stringContaining("<th>Label</th>"));
    expect(pdfMarkup).toEqual(expect.stringContaining("<th>Count</th>"));
    const fullReportMarkup = popup.document.write.mock.calls[1][0];
    expect(fullReportMarkup).toEqual(
      expect.stringContaining("Complete Analytics Report"),
    );
    expect(fullReportMarkup).toEqual(
      expect.stringContaining("Popular Categories"),
    );
    expect(fullReportMarkup).toEqual(
      expect.stringContaining("Facility Utilisation"),
    );
    expect(fullReportMarkup).toEqual(
      expect.stringContaining("Flagged Content Summary"),
    );
    expect(popup.print).toHaveBeenCalledTimes(2);

    anchorClickSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    openSpy.mockRestore();
  });

  it("surfaces API errors and saves a new facility with POST", async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    global.fetch = jest.fn((url, options = {}) => {
      if (url.includes("/admin/summary")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: "Summary unavailable" }),
        });
      }

      if (url.includes("/admin/users")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => {
            throw new Error("invalid json");
          },
        });
      }

      if (url.includes("/admin/facilities") && options.method === "POST") {
        return createFetchResponse({
          id: "fac-new",
          name: "New Facility",
          location: "Campus",
          slot_capacity: 6,
          is_active: true,
          operating_hours: [],
        });
      }

      if (url.includes("/admin/facilities")) {
        return createFetchResponse([]);
      }

      if (url.includes("/admin/analytics")) {
        return createFetchResponse(null);
      }

      if (url.includes("/admin/moderation")) {
        return createFetchResponse({
          flaggedListings: [],
          flaggedReviews: [],
        });
      }

      return createFetchResponse({});
    });

    render(<AdminDashboardActionsHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("summary-loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("summary-error")).toHaveTextContent(
      "Summary unavailable",
    );
    expect(screen.getByTestId("users-error")).toHaveTextContent(
      "Request failed: 500",
    );
    expect(screen.getByTestId("facility-count")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: /rename facility/i }));
    await user.click(screen.getByRole("button", { name: /save facility/i }));

    await waitFor(() => {
      expect(screen.getByTestId("saved-state")).toHaveTextContent("saved");
    });

    const postCall = global.fetch.mock.calls.find(
      ([url, options]) =>
        url.includes("/admin/facilities") && options?.method === "POST",
    );
    expect(postCall).toBeTruthy();
    expect(JSON.parse(postCall[1].body)).toMatchObject({
      id: null,
      name: "Edited Facility",
    });

    consoleSpy.mockRestore();
  });
});
