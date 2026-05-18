import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
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

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const builder = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      neq: jest.fn(() => builder),
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
      update: jest.fn(() => builder),
    };

    supabase.from.mockReturnValue(builder);
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
});
