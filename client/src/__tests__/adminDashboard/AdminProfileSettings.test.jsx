import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AdminProfileSettings from "../../components/adminDashboard/AdminProfileSettings";
import { supabase } from "../../config/supabaseClient";
import { redirectTo } from "../../utils/navigation";

jest.mock("../../utils/navigation", () => ({
  redirectTo: jest.fn(),
}));

describe("AdminProfileSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders fallback values and signs out", async () => {
    const user = userEvent.setup();

    render(<AdminProfileSettings user={{}} />);

    expect(screen.getByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText(/no photo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(redirectTo).toHaveBeenCalledWith("/");
    });
  });

  it("renders avatar and formatted dates when provided", () => {
    render(
      <AdminProfileSettings
        user={{
          fullName: "Admin User",
          email: "admin@unisquare.edu",
          avatarUrl: "https://example.com/avatar.png",
          createdAt: "2026-05-10T08:30:00.000Z",
          lastSignInAt: "2026-05-11T09:45:00.000Z",
        }}
      />,
    );

    expect(screen.getByAltText(/admin user avatar/i)).toBeInTheDocument();
    expect(screen.getAllByText("admin@unisquare.edu")).toHaveLength(2);
    expect(screen.queryByText(/no photo/i)).not.toBeInTheDocument();
  });
});
