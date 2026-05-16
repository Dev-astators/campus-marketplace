import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import StaffDashboard from "../../pages/StaffDashboard";
import useStaffDashboard from "../../hooks/useStaffDashboard";

jest.mock("../../hooks/useStaffDashboard");

describe("StaffDashboard", () => {
  const setActiveNav = jest.fn();
  const changeSelectedDate = jest.fn();
  const advanceTransaction = jest.fn();
  let hookState;

  beforeEach(() => {
    setActiveNav.mockReset();
    changeSelectedDate.mockReset();
    advanceTransaction.mockReset();

    hookState = {
      activeNav: "bookings",
      setActiveNav,
      viewContent: {
        eyebrow: "Trade facility management",
        title: "Campus exchange operations",
        description: "Monitor live staff activity across the trade facility.",
      },
      heroStats: [
        { label: "Reserved slots", value: 6, sub: "1 full windows" },
        { label: "Pending handoffs", value: 2, sub: "1 completed today" },
      ],
      staffProfile: {
        fullName: "Karabo Tlaka",
        email: "staff@wits.ac.za",
      },
      facilityProfile: {
        name: "Braamfontein Trade Facility",
        location: "Wits Central Campus Exchange Hub",
        slotCapacity: 10,
        collectionCapacity: 8,
        deskCount: 3,
        supervisor: "Kamo Maseko",
        supportLine: "011 555 0142",
        status: "Operational",
      },
      facilityHours: [
        { day: "Monday", open: "08:00", close: "18:00", active: true },
      ],
      todaysBookings: [
        {
          id: "slot-1",
          time: "09:00",
          booked: 10,
          capacity: 10,
          availabilityLabel: "Full",
          status: "Full",
          dropOffCount: 6,
          collectionCount: 4,
          bookingSummary: "6 drop-off, 4 collection",
          linkedTransactions: [
            {
              id: "TX-204",
              itemTitle: "Canon EOS R6 Mark II",
              bookingType: "dropoff",
            },
          ],
          facilityName: "Braamfontein Trade Facility",
          facilityLocation: "Wits Central Campus Exchange Hub",
        },
      ],
      totalCapacity: 10,
      totalBookedSlots: 10,
      pendingTransactions: 2,
      fullSlots: 1,
      transactionQueue: [
        {
          id: "TX-204",
          item: "Canon EOS R6 Mark II",
          seller: "Alex Chen",
          buyer: "Mia Patel",
          priceDisplay: "R18 500.00",
          category: "Electronics",
          dropOffSlot: "2026-05-10 09:00",
          collectionSlot: "2026-05-10 15:30",
          location: "Wits Central Campus Exchange Hub",
          stageLabel: "Drop-off booked",
          stageTone: "amber",
          action: "confirm_dropoff",
          actionLabel: "Confirm item received",
          progressValue: 1,
          progressMax: 5,
        },
      ],
      confirmedTransactionQueue: [
        {
          id: "TX-301",
          item: "MacBook Air",
          seller: "Chris Ndlovu",
          buyer: "Ava Singh",
          priceDisplay: "R14 000.00",
          category: "Electronics",
          dropOffSlot: "2026-05-10 11:00",
          collectionSlot: "2026-05-10 14:00",
          location: "Wits Central Campus Exchange Hub",
          stageLabel: "Complete",
          stageTone: "green",
          action: null,
          actionLabel: "",
          progressValue: 5,
          progressMax: 5,
        },
      ],
      activityLog: [
        {
          id: "activity-1",
          time: "09:00",
          title: "09:00 slot reached capacity",
          detail: "The facility stopped accepting more bookings for this slot.",
          audience: "Capacity enforcement active",
        },
      ],
      selectedDate: "2026-05-10",
      changeSelectedDate,
      advanceTransaction,
      loading: false,
      error: "",
      actionLoadingId: "",
    };

    useStaffDashboard.mockReturnValue(hookState);
  });

  it("renders the real-data staff dashboard layout", () => {
    render(<StaffDashboard />);

    expect(
      screen.getByRole("heading", { name: /campus exchange operations/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /braamfontein trade facility/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /drop-off and collection windows/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirmed transactions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/canon eos r6 mark ii/i)).toBeInTheDocument();
    expect(screen.queryByText(/macbook air/i)).not.toBeInTheDocument();
  });

  it("delegates transaction actions to the hook", async () => {
    const user = userEvent.setup();

    render(<StaffDashboard />);

    await user.click(
      screen.getByRole("button", { name: /confirm item received/i }),
    );

    expect(advanceTransaction).toHaveBeenCalledWith(
      "TX-204",
      "confirm_dropoff",
    );
  });

  it("delegates booking date filtering to the hook", async () => {
    render(<StaffDashboard />);

    fireEvent.change(screen.getByLabelText(/filter by date/i), {
      target: { value: "2026-05-12" },
    });

    expect(changeSelectedDate).toHaveBeenLastCalledWith("2026-05-12");
  });
});
