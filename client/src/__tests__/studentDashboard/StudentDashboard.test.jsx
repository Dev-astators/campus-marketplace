import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import StudentDashboard from "../../pages/StudentDashboard";
import useDashboardListings from "../../hooks/useDashboardListings";
import useListingFilters from "../../hooks/useListingFilters";
import { supabase } from "../../config/supabaseClient";
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
    profileId: "profile-1",
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
    localStorage.clear();
    supabase.from.mockReset();
    supabase.channel.mockReset();
    supabase.removeChannel.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => [{ id: "notification-1", is_read: false }],
    });
    useDashboardListings.mockReturnValue({
      user: baseUser,
      listings: [],
      loading: false,
    });
    useListingFilters.mockReturnValue(baseFilters);

    const defaultChannel = {
      on: jest.fn(function on() {
        return defaultChannel;
      }),
      subscribe: jest.fn(() => defaultChannel),
    };
    supabase.channel.mockReturnValue(defaultChannel);
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
      screen.queryByRole("button", { name: /post an item/i }),
    ).not.toBeInTheDocument();
  });

  it("toggles filters and shows the active filter count", async () => {
    const userDriver = userEvent.setup();

    useListingFilters.mockReturnValue({
      ...baseFilters,
      selectedCategory: "Textbooks",
      maxPrice: "500",
    });

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    );

    await userDriver.click(screen.getByRole("button", { name: /show filters/i }));

    expect(screen.getByText(/2 active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide filters/i })).toBeInTheDocument();
  });

  it("opens and closes the mobile sidebar overlay", async () => {
    const userDriver = userEvent.setup();

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    );

    await userDriver.click(screen.getByRole("button", { name: /open menu/i }));

    expect(
      screen.getByRole("button", { name: /close student navigation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /close menu/i }),
    ).toBeInTheDocument();

    await userDriver.click(
      screen.getByRole("button", { name: /close student navigation/i }),
    );

    expect(
      screen.getByRole("button", { name: /open menu/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the listing creation page", async () => {
    const userDriver = userEvent.setup();

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    );

    await userDriver.click(
      screen.getByRole("button", { name: /post an item/i }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/create-listing");
  });

  it("totals unread trade, message, and booking notifications", async () => {
    const channelHandlers = [];
    const channel = {
      on: jest.fn((event, filter, handler) => {
        channelHandlers.push(handler);
        return channel;
      }),
      subscribe: jest.fn(() => channel),
    };
    const messagesQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({ count: 2, error: null }),
    };
    const bookingsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: "booking-1" }, { id: "booking-2" }],
        error: null,
      }),
    };

    localStorage.setItem(
      "read_booking_notifications",
      JSON.stringify(["booking-booking-2"]),
    );
    global.fetch.mockResolvedValue({
      json: async () => [
        { id: "trade-1", is_read: false },
        { id: "trade-2", is_read: true },
      ],
    });
    supabase.from.mockImplementation((table) =>
      table === "messages" ? messagesQuery : bookingsQuery,
    );
    supabase.channel.mockReturnValue(channel);
    useDashboardListings.mockReturnValue({
      user: {
        ...baseUser,
        id: "auth-user-1",
      },
      listings: [],
      loading: false,
    });

    const { unmount } = render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(/4 unread notifications/i),
      ).toBeInTheDocument();
    });

    expect(supabase.channel).toHaveBeenCalledWith("notifications-bell");
    expect(channelHandlers).toHaveLength(6);

    channelHandlers[4]({ new: { booking_type: "drop_off" } });
    channelHandlers[5]({ new: { booking_type: "collection" } });
    channelHandlers[4]({ new: { booking_type: "maintenance" } });
    channelHandlers[5]({});

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });

  it("groups my listings into active, reserved, and other sections", async () => {
    const userDriver = userEvent.setup();

    useDashboardListings.mockReturnValue({
      user: baseUser,
      listings: [],
      loading: false,
    });
    useListingFilters.mockReturnValue({
      ...baseFilters,
      filteredListings: [
        { id: "listing-1", title: "Desk", status: "active" },
        { id: "listing-2", title: "Chair", status: "reserved" },
        { id: "listing-3", title: "Lamp", status: "sold" },
      ],
    });

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>,
    );

    await userDriver.click(screen.getByRole("button", { name: /my listings/i }));

    expect(screen.getByText(/^active$/i)).toBeInTheDocument();
    expect(screen.getByText(/^reserved$/i)).toBeInTheDocument();
    expect(screen.getByText(/^other$/i)).toBeInTheDocument();
  });
});
