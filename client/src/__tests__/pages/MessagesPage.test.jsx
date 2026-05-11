import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import MessagesPage from "../../pages/MessagesPage";
import { supabase } from "../../config/supabaseClient";

const ChatRoute = () => {
  const location = useLocation();
  return <p data-testid="chat-route">{location.search}</p>;
};

describe("MessagesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const builder = {
      select: jest.fn(() => builder),
      or: jest.fn(() => builder),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: "msg-1",
            listing_id: "listing-1",
            content: "Is this still available?",
            sent_at: "2026-05-10T10:00:00.000Z",
            sender_id: "user-1",
            receiver_id: "seller-1",
            listing: { title: "Vintage Book" },
            sender: { full_name: "Buyer One" },
            receiver: { full_name: "Seller One" },
          },
        ],
        error: null,
      }),
    };

    supabase.from.mockReturnValue(builder);
  });

  it("renders conversations and navigates to chat", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <Routes>
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/messages/i)).toBeInTheDocument();
    const conversationTitle = await screen.findByText(/vintage book/i);
    const conversationButton = conversationTitle.closest("button");

    await user.click(conversationButton);

    expect(await screen.findByTestId("chat-route")).toHaveTextContent(
      "seller=seller-1",
    );
  });
});
