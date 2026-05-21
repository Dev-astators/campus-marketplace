import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, jest } from "@jest/globals";
import Topbar from "../../components/staff-dashboard/Topbar";
import FacilityOverview from "../../components/staff-dashboard/FacilityOverview";

describe("staff dashboard panels", () => {
  it("updates the topbar search and triggers sidebar controls", async () => {
    const user = userEvent.setup();
    const handleMenuToggle = jest.fn();
    const handleSidebarToggle = jest.fn();

    render(
      <Topbar
        staffProfile={{
          email: "staff@wits.ac.za",
          fullName: "Sam Staff",
        }}
        onMenuToggle={handleMenuToggle}
        onSidebarToggle={handleSidebarToggle}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open sidebar/i }));
    await user.click(
      screen.getByRole("button", { name: /collapse sidebar/i }),
    );
    await user.type(
      screen.getByPlaceholderText(/search listings/i),
      "calculator",
    );
    fireEvent.submit(screen.getByRole("search"));

    expect(handleMenuToggle).toHaveBeenCalledTimes(1);
    expect(handleSidebarToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue("calculator")).toBeInTheDocument();
    expect(screen.getByText("staff@wits.ac.za")).toBeInTheDocument();
    expect(screen.getByText("Sam Staff")).toBeInTheDocument();
  });

  it("shows the expanded sidebar action and staff fallbacks", () => {
    render(<Topbar isSidebarCollapsed />);

    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Facility staff")).toBeInTheDocument();
    expect(screen.getByText("Staff member")).toBeInTheDocument();
  });

  it("renders the no-facility overview state", () => {
    render(
      <FacilityOverview
        facility={null}
        operatingHours={[]}
        totalCapacity={0}
        totalBookedSlots={0}
        fullSlots={0}
        pendingTransactions={0}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /no active trade facility found/i }),
    ).toBeInTheDocument();
  });

  it("renders facility metrics and closed operating hours", () => {
    const { rerender } = render(
      <FacilityOverview
        facility={{
          name: "Main Campus Trade Desk",
          location: "Library foyer",
          slotCapacity: 4,
          collectionCapacity: 3,
        }}
        operatingHours={[
          {
            day: "Monday",
            active: false,
            open: "09:00",
            close: "17:00",
          },
        ]}
        totalCapacity={12}
        totalBookedSlots={7}
        fullSlots={2}
        pendingTransactions={5}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /main campus trade desk/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Library foyer")).toBeInTheDocument();
    expect(screen.getByText("4 bookings per window")).toBeInTheDocument();
    expect(screen.getByText("3 bookings per window")).toBeInTheDocument();
    expect(screen.getByText("7/12 reserved")).toBeInTheDocument();
    expect(screen.getByText("2 capacity-locked slots")).toBeInTheDocument();
    expect(screen.getByText("5 active transactions")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();

    rerender(
      <FacilityOverview
        facility={{
          name: "Main Campus Trade Desk",
          location: "Library foyer",
          slotCapacity: 4,
          collectionCapacity: 3,
        }}
        operatingHours={[]}
        totalCapacity={12}
        totalBookedSlots={7}
        fullSlots={2}
        pendingTransactions={5}
      />,
    );

    expect(
      screen.getByText(/no operating hours have been configured yet/i),
    ).toBeInTheDocument();
  });
});
