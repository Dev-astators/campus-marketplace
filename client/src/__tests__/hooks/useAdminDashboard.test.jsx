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

describe("useAdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });

    global.fetch = jest.fn((url, options = {}) => {
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
});
