import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import AdminDashboard from "../../pages/AdminDashboard";
import useAdminDashboard from "../../hooks/useAdminDashboard";

jest.mock("../../hooks/useAdminDashboard");

describe("AdminDashboard", () => {
  const setActiveSection = jest.fn();

  beforeEach(() => {
    useAdminDashboard.mockReturnValue({
      navItems: [
        { id: "overview", label: "Overview" },
        { id: "moderation", label: "Moderation", badge: 2 },
      ],
      activeSection: "overview",
      setActiveSection,
      summaryCards: [
        { title: "Active Listings", value: "128", trend: "+6% vs last week" },
      ],
      facilitySettings: {
        name: "University Square",
        location: "Main Campus",
        slotCapacity: 6,
        isActive: true,
      },
      facilities: [],
      selectedFacilityId: null,
      operatingHours: [
        { day: "Mon", open: "08:00", close: "18:00", active: true },
      ],
      lastSavedAt: new Date("2025-01-01T10:00:00Z"),
      savingFacility: false,
      updateFacilitySetting: jest.fn(),
      updateOperatingHours: jest.fn(),
      saveFacilitySettings: jest.fn(),
      selectFacility: jest.fn(),
      flaggedListings: [
        {
          id: "L-102",
          title: "Calculus Textbook",
          reason: "Potential counterfeit",
          reportedBy: "Student 284",
        },
      ],
      flaggedReviews: [
        {
          id: "R-21",
          listing: "Desk Lamp",
          reason: "Abusive language",
          reportedBy: "Student 109",
        },
      ],
      resolveListingFlag: jest.fn(),
      resolveReviewFlag: jest.fn(),
      analytics: {
        popularCategories: [{ label: "Textbooks", count: 42 }],
        transactionsOverTime: [{ label: "Jan", count: 24 }],
        facilityUtilization: { booked: 5, capacity: 10 },
        flaggedSummary: { listings: 2, reviews: 3, messages: 1 },
      },
      exportCsv: jest.fn(),
      exportPdf: jest.fn(),
      users: [],
      togglingRole: null,
      updateUserRole: jest.fn(),
      loadingStates: {
        summary: false,
        analytics: false,
        moderation: false,
        users: false,
        facilities: false,
      },
      errors: {},
    });
  });

  afterEach(() => {
    setActiveSection.mockClear();
    document.body.innerHTML = "";
  });

  it("renders the admin header", () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/admin console/i)).toBeInTheDocument();
    expect(screen.getByText(/hello, admin/i)).toBeInTheDocument();
  });

  it("navigates to a section and scrolls", async () => {
    const user = userEvent.setup();
    const target = document.createElement("div");
    target.id = "moderation";
    target.scrollIntoView = jest.fn();
    document.body.appendChild(target);

    render(<AdminDashboard />);

    await user.click(screen.getByRole("button", { name: /moderation/i }));

    expect(setActiveSection).toHaveBeenCalledWith("moderation");
    expect(target.scrollIntoView).toHaveBeenCalled();
  });
});
