import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "@jest/globals";
import ProfileSettings from "../../components/studentDashboard/ProfileSettings";
import { supabase } from "../../config/supabaseClient";
import { redirectTo } from "../../utils/navigation";

jest.mock("../../utils/navigation", () => ({
  redirectTo: jest.fn(),
}));

describe("ProfileSettings", () => {
  const user = {
    fullName: "Ada Lovelace",
    email: "ada@uni.edu",
    studentNumber: "ada",
    role: "student",
    createdAt: "2025-01-01T00:00:00Z",
    lastSignInAt: "2025-02-01T12:30:00Z",
    avatarUrl: "https://example.test/avatar.png",
  };

  beforeEach(() => {
    supabase.auth.signOut.mockClear();
  });

  it("renders the key profile details", () => {
    render(<ProfileSettings user={user} />);

    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ada@uni.edu", { selector: "p" }),
    ).toBeInTheDocument();
    expect(screen.getByText("student")).toBeInTheDocument();
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
    expect(screen.getByText(/last sign-in/i)).toBeInTheDocument();
  });

  it("signs out and redirects to the home page", async () => {
    const userDriver = userEvent.setup();

    render(<ProfileSettings user={user} />);

    await userDriver.click(screen.getByRole("button", { name: /sign out/i }));

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(redirectTo).toHaveBeenCalledWith("/");
    });
  });
});
