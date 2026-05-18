import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import NotificationsPage from "../../pages/NotificationsPage";
import { supabase } from "../../config/supabaseClient";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

const ChatRoute = () => {
  const location = useLocation();
  return <p data-testid="chat-route">{location.search}</p>;
};

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Notification = function NotificationMock() {};
    global.Notification.permission = "granted";
    global.Notification.requestPermission = jest.fn();
    global.fetch = jest.fn().mockResolvedValue(createFetchResponse([]));
    localStorage.clear();

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const messageBuilder = {
      select: jest.fn(() => messageBuilder),
      eq: jest.fn(() => messageBuilder),
      neq: jest.fn(() => messageBuilder),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: "msg-1",
            content: "Hi there",
            sent_at: "2026-05-10T10:00:00.000Z",
            is_read: false,
            listing_id: "listing-1",
            sender_id: "seller-1",
            receiver_id: "user-1",
            listing: { title: "Campus Hoodie" },
            sender: { full_name: "Seller One" },
          },
        ],
        error: null,
      }),
      update: jest.fn(() => messageBuilder),
    };

    const bookingBuilder = {
      select: jest.fn(() => bookingBuilder),
      eq: jest.fn(() => bookingBuilder),
      in: jest.fn(() => bookingBuilder),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: "booking-1",
            status: "confirmed",
            booking_type: "collection",
            confirmed_at: "2026-05-11T10:00:00.000Z",
            student_id: "user-1",
            slot: {
              slot_date: "2026-05-15",
              slot_time: "09:00:00",
              facility: {
                name: "Main Facility",
                location: "East Campus",
              },
            },
            transaction: {
              listing: { title: "Campus Hoodie" },
            },
          },
        ],
        error: null,
      }),
    };

    supabase.from.mockImplementation((table) => {
      if (table === "messages") return messageBuilder;
      if (table === "facility_bookings") return bookingBuilder;
      return messageBuilder;
    });

    const channelBuilder = {
      on: jest.fn(() => channelBuilder),
      subscribe: jest.fn(() => channelBuilder),
    };

    supabase.channel.mockReturnValue(channelBuilder);
    supabase.removeChannel.mockImplementation(() => {});
  });

  it("renders notifications and opens a chat", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/new message from seller one/i),
    ).toBeInTheDocument();

    const notificationButton = screen
      .getByText(/new message from seller one/i)
      .closest("button");

    await user.click(notificationButton);

    expect(await screen.findByTestId("chat-route")).toHaveTextContent(
      "seller=seller-1",
    );
  });

  it("marks all notifications as read", async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "notif-1",
            title: "Payment confirmed",
            message: "Seller should book drop-off",
            type: "sale",
            is_read: false,
            created_at: "2026-05-12T10:00:00.000Z",
            related_transaction_id: "tx-1",
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ ok: true }));

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText(/new message from seller one/i);
    await user.click(screen.getByRole("button", { name: /mark all as read/i }));

    await waitFor(() => {
      expect(localStorage.getItem("read_booking_notifications")).toContain(
        "booking-1",
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payments/notifications/notif-1/read"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("opens trade notifications and routes to my sales", async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "notif-2",
            title: "Payment confirmed",
            message: "Please book a drop-off",
            type: "sale",
            is_read: false,
            created_at: "2026-05-12T12:00:00.000Z",
            related_transaction_id: "tx-2",
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ ok: true }));

    const DashboardRoute = () => {
      const location = useLocation();
      return (
        <p data-testid="dashboard-route">{location.state?.tab || ""}</p>
      );
    };

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/student-dashboard" element={<DashboardRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    const tradeButton = await screen.findByRole("button", {
      name: /payment confirmed/i,
    });

    await user.click(tradeButton);

    expect(await screen.findByTestId("dashboard-route")).toHaveTextContent(
      "my-sales",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payments/notifications/notif-2/read"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("opens booking notifications without leaving the page", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    const bookingButton = await screen.findByRole("button", {
      name: /collection booking confirmed/i,
    });

    await user.click(bookingButton);

    await waitFor(() => {
      expect(localStorage.getItem("read_booking_notifications")).toContain(
        "booking-1",
      );
    });

    expect(screen.queryByTestId("chat-route")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^read$/i })).toBeInTheDocument();
  });

  it("stops loading without a signed-in user", async () => {
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
    });

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark all as read/i }),
    ).not.toBeInTheDocument();
  });

  it("opens purchase trade notifications and routes to purchases", async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce(
        createFetchResponse([
          {
            id: "notif-3",
            title: "Purchase confirmed",
            message: "Choose a collection slot",
            type: "purchase",
            is_read: false,
            created_at: "2026-05-12T12:00:00.000Z",
            related_transaction_id: "tx-3",
          },
        ]),
      )
      .mockResolvedValueOnce(createFetchResponse({ ok: true }));

    const DashboardRoute = () => {
      const location = useLocation();
      return <p data-testid="dashboard-route">{location.state?.tab || ""}</p>;
    };

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/student-dashboard" element={<DashboardRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("button", { name: /purchase confirmed/i }),
    );

    expect(await screen.findByTestId("dashboard-route")).toHaveTextContent(
      "my-purchases",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payments/notifications/notif-3/read"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("keeps locally read booking notifications in the read list", async () => {
    localStorage.setItem(
      "read_booking_notifications",
      JSON.stringify(["booking-booking-1"]),
    );

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /^read$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /collection booking confirmed/i }),
    ).toBeInTheDocument();
  });

  it("requests browser notification permission when it is not granted", async () => {
    global.Notification.permission = "default";

    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: /notifications/i });

    expect(global.Notification.requestPermission).toHaveBeenCalledTimes(1);
  });
});
