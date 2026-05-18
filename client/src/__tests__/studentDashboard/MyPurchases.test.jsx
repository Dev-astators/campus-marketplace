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
    // const ratingsSelectScores = jest.fn().mockResolvedValue({
    //   data: [{ score: 5 }, { score: 4 }],
    //   error: null,
    // });
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

  it("books a collection slot after the seller drop-off", async () => {
    const user = userEvent.setup();
    const purchases = [
      {
        id: "tx-collection",
        status: "confirmed",
        online_amount: 250,
        cash_shortfall: 0,
        cash_settled: true,
        listings: { title: "Graphing Calculator" },
        seller: { full_name: "Seller One" },
        facility_bookings: [
          {
            id: "booking-dropoff",
            booking_type: "drop_off",
            status: "confirmed",
            facility_slots: {
              id: "dropoff-slot",
              facility_id: "facility-1",
              slot_date: "2026-05-20",
              slot_time: "10:00:00",
            },
          },
        ],
      },
    ];

    global.fetch
      .mockResolvedValueOnce(createFetchResponse(purchases))
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "collection-slot",
            slot_date: "2026-05-20",
            slot_time: "12:30:00",
            capacity: 4,
            booked_count: 1,
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ ok: true }))
      .mockResolvedValueOnce(createFetchResponse([]));

    render(<MyPurchases profileId="buyer-1" />);

    await user.click(
      await screen.findByRole("button", { name: /book collection slot/i }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(await screen.findByLabelText(/12:30/i));
    await user.click(
      screen.getByRole("button", { name: /confirm collection/i }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/payments/book-slot"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("collection-slot"),
        }),
      );
    });
  });

  it("shows collection booking errors before loading slots", async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce(
      createFetchResponse([
        {
          id: "tx-waiting",
          status: "confirmed",
          online_amount: 100,
          cash_shortfall: 0,
          cash_settled: true,
          listings: { title: "Lab Coat" },
          seller: { full_name: "Seller One" },
          facility_bookings: [],
        },
      ]),
    );

    const { unmount } = render(<MyPurchases profileId="buyer-1" />);

    expect(
      await screen.findByText(/waiting for seller to book a drop-off slot/i),
    ).toBeInTheDocument();

    unmount();

    global.fetch.mockReset();
    global.fetch.mockResolvedValueOnce(
      createFetchResponse([
        {
          id: "tx-invalid",
          status: "confirmed",
          online_amount: 100,
          cash_shortfall: 0,
          cash_settled: true,
          listings: { title: "Microscope" },
          seller: { full_name: "Seller Two" },
          facility_bookings: [
            {
              id: "booking-dropoff",
              booking_type: "drop_off",
              status: "confirmed",
              facility_slots: {
                facility_id: "facility-1",
                slot_date: "not-a-date",
                slot_time: "bad-time",
              },
            },
          ],
        },
      ]),
    );

    render(<MyPurchases profileId="buyer-1" />);

    await user.click(
      await screen.findByRole("button", { name: /book collection slot/i }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/drop-off slot time is invalid/i);
  });

  it("shows slot loading and booking failures", async () => {
    const user = userEvent.setup();
    const purchases = [
      {
        id: "tx-failure",
        status: "confirmed",
        online_amount: 150,
        cash_shortfall: 0,
        cash_settled: true,
        listings: { title: "Desk Lamp" },
        seller: { full_name: "Seller One" },
        facility_bookings: [
          {
            id: "booking-dropoff",
            booking_type: "drop_off",
            status: "confirmed",
            facility_slots: {
              facility_id: "facility-1",
              slot_date: "2026-05-20",
              slot_time: "10:00:00",
            },
          },
        ],
      },
    ];

    global.fetch
      .mockResolvedValueOnce(createFetchResponse(purchases))
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "slot-taken",
            slot_date: "2026-05-20",
            slot_time: "13:00:00",
            capacity: 2,
            booked_count: 1,
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ error: "Slot taken" }, false));

    render(<MyPurchases profileId="buyer-1" />);

    await user.click(
      await screen.findByRole("button", { name: /book collection slot/i }),
    );
    expect(await screen.findByLabelText(/13:00/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/13:00/i));
    await user.click(
      screen.getByRole("button", { name: /confirm collection/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/slot taken/i);
  });

  it("updates an existing rating", async () => {
    const user = userEvent.setup();
    const purchases = [
      {
        id: "tx-rated",
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

    const ratingsUpdateEq = jest.fn().mockResolvedValue({ error: null });
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
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: "rating-1" },
                      error: null,
                    }),
                  })),
                })),
              };
            }

            return {
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }),
          update: jest.fn().mockReturnValue({
            eq: ratingsUpdateEq,
          }),
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
    await user.selectOptions(screen.getByLabelText(/rating/i), "4");
    await user.type(screen.getByLabelText(/review/i), "Still works well.");
    await user.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() => {
      expect(ratingsUpdateEq).toHaveBeenCalledWith("id", "rating-1");
      expect(global.alert).toHaveBeenCalledWith("Rating updated successfully!");
    });
  });

  it("alerts when a collected purchase has no seller id to rate", async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce(
      createFetchResponse([
        {
          id: "tx-no-seller",
          status: "complete",
          online_amount: 250,
          cash_shortfall: 0,
          cash_settled: true,
          listings: { title: "Calculator" },
          seller: { full_name: "Unknown Seller" },
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
      ]),
    );

    render(<MyPurchases profileId="buyer-1" />);

    await user.click(await screen.findByRole("button", { name: /rate product/i }));
    await user.click(screen.getByRole("button", { name: /submit rating/i }));

    expect(global.alert).toHaveBeenCalledWith("Seller ID not found");
  });
});
