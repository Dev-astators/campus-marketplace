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
import MySales from "../../components/studentDashboard/MySales";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

describe("MySales booking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("books a drop-off slot and closes the modal", async () => {
    const user = userEvent.setup();

    const sale = {
      id: "tx-1",
      status: "confirmed",
      online_amount: 250,
      listings: { title: "Scientific Calculator" },
      buyer: { full_name: "Buyer One" },
      facility_bookings: [
        {
          id: "booking-1",
          booking_type: "collection",
          facility_slots: {
            facility_id: "fac-1",
            slot_date: "2026-05-12",
            slot_time: "12:00:00",
            trade_facilities: { name: "Main Campus", location: "Braamfontein" },
          },
        },
      ],
    };

    const saleWithDropoff = {
      ...sale,
      facility_bookings: [
        ...sale.facility_bookings,
        {
          id: "booking-2",
          booking_type: "drop_off",
          facility_slots: {
            facility_id: "fac-1",
            slot_date: "2026-05-12",
            slot_time: "10:00:00",
            trade_facilities: { name: "Main Campus", location: "Braamfontein" },
          },
        },
      ],
    };

    global.fetch
      .mockResolvedValueOnce(createFetchResponse([sale]))
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "slot-2",
            slot_date: "2026-05-12",
            slot_time: "10:00:00",
            capacity: 3,
            booked_count: 1,
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ bookingId: "booking-2" }))
      .mockResolvedValueOnce(createFetchResponse([saleWithDropoff]));

    render(<MySales profileId="seller-1" />);

    expect(await screen.findByText(/my sales/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /book drop-off slot/i }),
    );

    expect(
      await screen.findByRole("dialog", { name: /book drop-off slot/i }),
    ).toBeInTheDocument();

    const slotLabel = new Date("2026-05-12").toDateString();
    await user.click(screen.getByText(new RegExp(slotLabel)));
    await user.click(screen.getByRole("button", { name: /confirm drop-off/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /book drop-off slot/i }),
      ).not.toBeInTheDocument();
    });

    const bookingCall = global.fetch.mock.calls.find(([url]) =>
      url.includes("/api/payments/book-dropoff"),
    );
    expect(bookingCall).toBeTruthy();
    const bookingPayload = JSON.parse(bookingCall[1].body);
    expect(bookingPayload).toMatchObject({
      transactionId: "tx-1",
      slotId: "slot-2",
      sellerId: "seller-1",
    });
  });
});
