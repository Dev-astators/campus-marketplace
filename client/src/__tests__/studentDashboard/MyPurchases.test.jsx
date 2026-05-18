import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import MyPurchases from "../../components/studentDashboard/MyPurchases";
import { supabase } from "../../config/supabaseClient";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

describe("MyPurchases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
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

  it("renders an error state when the request fails", async () => {
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ error: "Service unavailable" }, false),
    );

    render(<MyPurchases profileId="buyer-1" />);

    expect(await screen.findByText(/error: service unavailable/i)).toBeInTheDocument();
  });

  it("submits a new rating for a collected purchase", async () => {
    const user = userEvent.setup();
    const purchases = [
      {
        id: "tx-1",
        status: "complete",
        online_amount: 250,
        cash_shortfall: 0,
        cash_settled: true,
        seller_id: "seller-1",
        listings: { title: "Laptop Stand" },
        seller: { full_name: "Seller One", id: "seller-1" },
        facility_bookings: [
          {
            id: "booking-1",
            booking_type: "collection",
            status: "complete",
            facility_slots: {
              slot_date: "2026-05-12",
              slot_time: "10:30:00",
            },
          },
        ],
      },
    ];

    global.fetch.mockResolvedValueOnce(createFetchResponse(purchases));

    const ratingsMaybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const ratingsInsert = jest.fn().mockResolvedValue({ error: null });
    const ratingsSelectScores = jest.fn().mockResolvedValue({
      data: [{ score: 5 }, { score: 4 }],
      error: null,
    });
    const profilesUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    supabase.from.mockImplementation((table) => {
      if (table === "ratings") {
        return {
          select: jest.fn((selection) => {
            if (selection === "*") {
              return {
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    maybeSingle: ratingsMaybeSingle,
                  })),
                })),
              };
            }

            return {
              eq: jest.fn().mockResolvedValue({
                data: [{ score: 5 }, { score: 4 }],
                error: null,
              }),
            };
          }),
          insert: ratingsInsert,
        };
      }

      if (table === "profiles") {
        return {
          update: profilesUpdate,
        };
      }

      return {};
    });

    render(<MyPurchases profileId="buyer-1" />);

    await user.click(await screen.findByRole("button", { name: /rate product/i }));
    await user.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() => {
      expect(ratingsInsert).toHaveBeenCalledWith({
        transaction_id: "tx-1",
        reviewer_id: "buyer-1",
        reviewee_id: "seller-1",
        score: 5,
        review_text: "",
      });
      expect(global.alert).toHaveBeenCalledWith("Rating submitted successfully!");
    });
  });
});
