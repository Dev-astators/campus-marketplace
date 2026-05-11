import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import TransactionFlowPanel from "../../components/staff-dashboard/TransactionFlowPanel";

describe("TransactionFlowPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the related slot queue for transactions that share a slot", () => {
    render(
      <TransactionFlowPanel
        transactions={[
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
        ]}
        slots={[
          {
            id: "slot-1",
            time: "09:00",
            linkedTransactions: [
              {
                bookingId: "booking-1",
                transactionId: "TX-204",
                itemTitle: "Canon EOS R6 Mark II",
                bookingTypeLabel: "Drop-off",
                seller: "Alex Chen",
                buyer: "Mia Patel",
              },
              {
                bookingId: "booking-2",
                transactionId: "TX-205",
                itemTitle: "MacBook Air M3",
                bookingTypeLabel: "Collection",
                seller: "Jordan Naidoo",
                buyer: "Lebo Khumalo",
              },
            ],
          },
        ]}
        onAdvance={jest.fn()}
        actionLoadingId=""
      />,
    );

    expect(screen.getByText(/related slot queue/i)).toBeInTheDocument();
    expect(screen.getByText(/09:00 slot/i)).toBeInTheDocument();
    expect(screen.getByText("TX-204")).toBeInTheDocument();
    expect(screen.getByText("TX-205")).toBeInTheDocument();
    expect(screen.getByText("MacBook Air M3")).toBeInTheDocument();
    expect(screen.getByText("Buyer: Lebo Khumalo")).toBeInTheDocument();
  });
});
