import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PaymentPage from "../../pages/PaymentPage";
import { supabase } from "../../config/supabaseClient";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

const renderPaymentPage = (path = "/payment/success?transaction_id=tx-1") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/payment/success"
          element={<PaymentPage result="success" />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("PaymentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("confirms payment, loads slots, and books a collection slot", async () => {
    const user = userEvent.setup();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "user-1" },
        error: null,
      }),
    });

    global.fetch
      .mockResolvedValueOnce(createFetchResponse({ status: "confirmed" }))
      .mockResolvedValueOnce(
        createFetchResponse([
          { id: "fac-1", name: "Main Campus", location: "Braamfontein" },
        ]),
      )
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "slot-1",
            slot_date: "2026-05-11",
            slot_time: "09:00:00",
            capacity: 2,
            booked_count: 0,
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ bookingId: "booking-1" }));

    renderPaymentPage();

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();

    const slotLabel = new Date("2026-05-11").toDateString();
    await user.click(screen.getByText(new RegExp(slotLabel)));
    await user.click(
      screen.getByRole("button", { name: /confirm collection slot/i }),
    );

    expect(await screen.findByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.getByText(/booking id/i)).toHaveTextContent("booking-1");

    const bookingCall = global.fetch.mock.calls.find(([url]) =>
      url.includes("/api/payments/book-slot"),
    );
    expect(bookingCall).toBeTruthy();
    const bookingPayload = JSON.parse(bookingCall[1].body);
    expect(bookingPayload).toMatchObject({
      transactionId: "tx-1",
      slotId: "slot-1",
      studentId: "user-1",
      bookingType: "collection",
    });
  });
});
