import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import SignIn from "../components/SignIn";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
  });

  it("starts Google OAuth with the app origin as the redirect target", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /sign-in with google/i }),
    );

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  });

  it("navigates to sign up when the sign up link is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>,
    );

    await user.click(screen.getByText(/sign up/i));

    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });

  it("logs OAuth errors and restores the button state", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    supabase.auth.signInWithOAuth.mockResolvedValue({
      error: { message: "OAuth unavailable" },
    });

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /sign-in with google/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign-in with google/i }),
      ).toBeEnabled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Google sign-in error:",
      "OAuth unavailable",
    );

    consoleErrorSpy.mockRestore();
  });
});
