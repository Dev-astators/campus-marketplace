import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import Chat from "../../components/Chat";

describe("Chat", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("shows the empty state and disables send", () => {
    render(
      <Chat
        messages={[]}
        currentUserId="user-1"
        input=""
        setInput={jest.fn()}
        onSend={jest.fn()}
      />,
    );

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("renders messages and calls onSend", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();

    render(
      <Chat
        messages={[
          {
            id: "msg-1",
            sender_id: "user-1",
            content: "Hello there",
            sent_at: "2026-05-10T10:00:00.000Z",
            status: "read",
          },
          {
            id: "msg-2",
            sender_id: "user-2",
            content: "Hi!",
            sent_at: "2026-05-10T10:01:00.000Z",
          },
        ]}
        currentUserId="user-1"
        input="Thanks"
        setInput={jest.fn()}
        onSend={onSend}
      />,
    );

    expect(screen.getByText(/hello there/i)).toBeInTheDocument();
    expect(screen.getByText("✔✔")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("calls setInput when typing", async () => {
    const user = userEvent.setup();
    const setInput = jest.fn();

    render(
      <Chat
        messages={[]}
        currentUserId="user-1"
        input=""
        setInput={setInput}
        onSend={jest.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText(/type a message/i), "Hi");

    expect(setInput).toHaveBeenCalled();
  });
});
