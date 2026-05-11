import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChatPage from "../../pages/ChatPage";
import { supabase } from "../../config/supabaseClient";

describe("ChatPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
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
});
