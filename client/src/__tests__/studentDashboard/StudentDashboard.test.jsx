import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import StudentDashboard from "../../pages/StudentDashboard";
import useDashboardListings from "../../hooks/useDashboardListings";
import useListingFilters from "../../hooks/useListingFilters";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../../hooks/useDashboardListings");
jest.mock("../../hooks/useListingFilters");

describe("StudentDashboard", () => {
  const baseUser = {
    fullName: "Ada Lovelace",
    name: "Ada",
    email: "ada@uni.edu",
  };

  const baseFilters = {
    search: "",
    setSearch: jest.fn(),
    selectedCategory: "All Categories",
    setSelectedCategory: jest.fn(),
    selectedCondition: "all",
    setSelectedCondition: jest.fn(),
    minPrice: "",
    setMinPrice: jest.fn(),
    maxPrice: "",
    setMaxPrice: jest.fn(),
    sortBy: "newest",
    setSortBy: jest.fn(),
    clearFilters: jest.fn(),
    filteredListings: [],
    listingsHeading: "Marketplace Listings",
  };

  beforeEach(() => {
    mockNavigate.mockReset();
    useDashboardListings.mockReturnValue({
      user: baseUser,
      listings: [],
      loading: false,
    });
    useListingFilters.mockReturnValue(baseFilters);
  });

  it("renders the greeting and listings heading", () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /hello, ada/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Marketplace Listings")).toBeInTheDocument();
  });

  it("navigates to messages when the sidebar button is clicked", async () => {
    const userDriver = userEvent.setup();

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    await userDriver.click(screen.getByRole("button", { name: /messages/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/messages");
  });

  it("shows profile settings when profile tab is selected", async () => {
    const userDriver = userEvent.setup();

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    await userDriver.click(
      screen.getByRole("button", { name: /profile settings/i }),
    );

    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create listing/i }),
    ).not.toBeInTheDocument();
  });
});
