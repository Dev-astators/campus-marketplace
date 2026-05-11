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
    expect(await screen.findByText(/curated categories/i)).toBeInTheDocument();
    expect(screen.getByText(/exclusive to wits students/i)).toBeInTheDocument();
  });
});
