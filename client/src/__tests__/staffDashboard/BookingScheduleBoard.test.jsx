import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import BookingScheduleBoard from "../../components/staff-dashboard/BookingScheduleBoard";

describe("BookingScheduleBoard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders every booking linked to the same slot", () => {
    render(
      <BookingScheduleBoard
        slots={[
          {
            id: "slot-1",
            time: "09:00",
            booked: 2,
            capacity: 10,
            availabilityLabel: "8 left",
            status: "Open",
            dropOffCount: 1,
            collectionCount: 1,
            bookingSummary: "1 drop-off, 1 collection",
            facilityName: "Braamfontein Trade Facility",
            facilityLocation: "Wits Central Campus Exchange Hub",
            linkedTransactions: [
              {
                bookingId: "booking-1",
                transactionId: "TX-204",
                itemTitle: "Canon EOS R6 Mark II",
                bookingType: "dropoff",
                bookingTypeLabel: "Drop-off",
                seller: "Alex Chen",
                buyer: "Mia Patel",
              },
              {
                bookingId: "booking-2",
                transactionId: "TX-205",
                itemTitle: "MacBook Air M3",
                bookingType: "collection",
                bookingTypeLabel: "Collection",
                seller: "Jordan Naidoo",
                buyer: "Lebo Khumalo",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText("TX-204")).toBeInTheDocument();
    expect(screen.getByText("Canon EOS R6 Mark II")).toBeInTheDocument();
    expect(screen.getByText("TX-205")).toBeInTheDocument();
    expect(screen.getByText("MacBook Air M3")).toBeInTheDocument();
    expect(screen.getByText("Seller: Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("Buyer: Lebo Khumalo")).toBeInTheDocument();
  });
});
