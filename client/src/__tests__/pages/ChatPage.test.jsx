import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChatPage from "../../pages/ChatPage";
import { supabase } from "../../config/supabaseClient";

describe("ChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
    global.fetch = jest.fn();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it("renders preview messages and allows sending", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/chat/listing-1?seller=seller-1"]}>
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/messages" element={<p>Messages home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /^chat$/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/still available/i)).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/type a message/i),
      "See you tomorrow",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText(/see you tomorrow/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back to messages/i }));

    expect(await screen.findByText(/messages home/i)).toBeInTheDocument();
  });

  it("loads authenticated chat context and sends a message", async () => {
    const user = userEvent.setup();

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const profileBuilder = {
      select: jest.fn(() => profileBuilder),
      eq: jest.fn(() => profileBuilder),
      single: jest.fn().mockResolvedValue({
        data: { full_name: "Seller One" },
        error: null,
      }),
    };

    const messageBuilder = {
      update: jest.fn(() => messageBuilder),
      eq: jest.fn(() => messageBuilder),
    };

    supabase.from.mockImplementation((table) => {
      if (table === "profiles") return profileBuilder;
      if (table === "messages") return messageBuilder;
      return messageBuilder;
    });

    const channelBuilder = {
      on: jest.fn(() => channelBuilder),
      subscribe: jest.fn((callback) => {
        callback?.("SUBSCRIBED");
        return channelBuilder;
      }),
    };

    supabase.channel.mockReturnValue(channelBuilder);

    global.fetch = jest.fn((url, options) => {
      if (url.includes("/api/listings/listing-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            listing: { title: "Campus Desk", price: 450 },
          }),
        });
      }

      if (
        url.includes("/api/messages/listing-1/user-1/seller-1") &&
        !options?.method
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            messages: [
              {
                id: "message-1",
                listing_id: "listing-1",
                sender_id: "seller-1",
                receiver_id: "user-1",
                content: "Hello there",
                sent_at: new Date().toISOString(),
                is_read: true,
              },
            ],
          }),
        });
      }

      if (url.includes("/api/messages") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ messages: [] }),
      });
    });

    render(
      <MemoryRouter initialEntries={["/chat/listing-1?seller=seller-1"]}>
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/messages" element={<p>Messages home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/seller one/i)).toBeInTheDocument();
    expect(await screen.findByText(/campus desk/i)).toBeInTheDocument();
    expect(await screen.findByText(/r450/i)).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/type a message/i),
      "I can collect today",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/messages"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("I can collect today"),
        }),
      );
    });
  });

  it("falls back to a generic listing summary when the listing context fails", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const profileBuilder = {
      select: jest.fn(() => profileBuilder),
      eq: jest.fn(() => profileBuilder),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("missing"),
      }),
    };

    const messageBuilder = {
      update: jest.fn(() => messageBuilder),
      eq: jest.fn(() => messageBuilder),
    };

    supabase.from.mockImplementation((table) => {
      if (table === "profiles") return profileBuilder;
      if (table === "messages") return messageBuilder;
      return messageBuilder;
    });

    supabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    });

    global.fetch = jest.fn((url) => {
      if (url.includes("/api/listings/listing-2")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "bad request" }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ messages: [] }),
      });
    });

    render(
      <MemoryRouter initialEntries={["/chat/listing-2?seller=seller-2"]}>
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/messages" element={<p>Messages home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findAllByText(/marketplace listing/i)).toHaveLength(2);
    expect(screen.getByText(/unknown user/i)).toBeInTheDocument();
  });
});
