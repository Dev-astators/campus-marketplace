import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
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
      facility_bookings: [],
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
          { id: "fac-1", name: "Main Campus", location: "Braamfontein" },
        ]),
      )
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

    const dialog = await screen.findByRole("dialog", {
      name: /book drop-off slot/i,
    });

    const slotLabel = new Date("2026-05-12").toDateString();
    await user.click(within(dialog).getByText(new RegExp(slotLabel)));
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

  it("renders the empty sales state", async () => {
    global.fetch.mockResolvedValueOnce(createFetchResponse([]));

    render(<MySales profileId="seller-1" />);

    expect(
      await screen.findByText(/you haven't sold anything yet/i),
    ).toBeInTheDocument();
  });

  it("renders an error when sales cannot be loaded", async () => {
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ error: "Sales unavailable" }, false),
    );

    render(<MySales profileId="seller-1" />);

    expect(await screen.findByText(/error: sales unavailable/i)).toBeInTheDocument();
  });

  it("locks drop-off booking to the buyer collection facility", async () => {
    const user = userEvent.setup();
    const sale = {
      id: "tx-locked",
      status: "confirmed",
      online_amount: 180,
      listings: { title: "Lab Coat" },
      buyer: { full_name: "Buyer Two" },
      facility_bookings: [
        {
          id: "booking-collection",
          booking_type: "collection",
          facility_slots: {
            facility_id: "fac-locked",
            slot_date: "2026-05-13",
            slot_time: "13:00:00",
            trade_facilities: {
              name: "Science Campus",
              location: "West Wing",
            },
          },
        },
      ],
    };

    global.fetch
      .mockResolvedValueOnce(createFetchResponse([sale]))
      .mockResolvedValueOnce(createFetchResponse([]));

    render(<MySales profileId="seller-1" />);

    await user.click(
      await screen.findByRole("button", { name: /book drop-off slot/i }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: /book drop-off slot/i,
    });

    expect(
      within(dialog).getByText(/facility locked to buyer collection/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/science campus/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/west wing/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/no slots available/i)).toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText(/choose a facility/i),
    ).not.toBeInTheDocument();
  });
});
