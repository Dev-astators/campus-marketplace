// src/__tests__/App.test.jsx
// A smoke test to verify Jest + React Testing Library are wired up correctly.
// Replace this with tests for your actual components.
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import App from "../App";
import { supabase } from "../config/supabaseClient";

describe("App routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      callback("INITIAL_SESSION", null);
      return {
        data: {
          subscription: { unsubscribe: jest.fn() },
        },
      };
    });
  });

  it("renders the welcome page for signed-out users", async () => {
    render(<App />);
    expect(
      await screen.findByText(/browse the essentials students/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/exclusive to wits students/i)).toBeInTheDocument();
  });

  it("renders the payment cancel route", async () => {
    window.history.pushState({}, "", "/payment/cancel");

    render(<App />);

    expect(await screen.findByText(/payment cancelled/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to listing/i }),
    ).toBeInTheDocument();
  });

  it("renders the notifications route when signed out", async () => {
    window.history.pushState({}, "", "/notifications");
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    render(<App />);

    expect(await screen.findByText(/notifications/i)).toBeInTheDocument();
  });
});
