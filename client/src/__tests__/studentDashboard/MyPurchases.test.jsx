import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import MyPurchases from "../../components/studentDashboard/MyPurchases";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

describe("MyPurchases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("renders the empty state when there are no purchases", async () => {
    global.fetch.mockResolvedValueOnce(createFetchResponse([]));

    render(<MyPurchases profileId="buyer-1" />);

    expect(
      await screen.findByText(/you haven't bought anything yet/i),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payments/my-purchases/buyer-1"),
    );
  });

  it("shows cash shortfall and collection slot details", async () => {
    const purchases = [
      {
        id: "tx-1",
        status: "confirmed",
        online_amount: 100,
        cash_shortfall: 50,
        cash_settled: false,
        listings: { title: "Calculus Textbook" },
        seller: { full_name: "Seller One" },
        facility_bookings: [
          {
            id: "booking-1",
            booking_type: "collection",
            status: "pending",
            facility_slots: {
              slot_date: "2026-05-12",
              slot_time: "10:30:00",
            },
          },
        ],
      },
    ];

    global.fetch.mockResolvedValueOnce(createFetchResponse(purchases));

    render(<MyPurchases profileId="buyer-1" />);

    expect(await screen.findByText(/my purchases/i)).toBeInTheDocument();
    expect(screen.getByText(/cash to pay at facility/i)).toBeInTheDocument();
    expect(screen.getByText("R50.00")).toBeInTheDocument();
    expect(screen.getByText(/pending at facility/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting staff/i)).toBeInTheDocument();

    const slotLabel = new Date("2026-05-12").toDateString();
    expect(screen.getByText(new RegExp(slotLabel))).toBeInTheDocument();
  });
});
