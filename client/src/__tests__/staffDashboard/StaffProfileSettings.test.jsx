import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import StaffProfileSettings from "../../components/staff-dashboard/StaffProfileSettings";
import { supabase } from "../../config/supabaseClient";
import { redirectTo } from "../../utils/navigation";

jest.mock("../../utils/navigation", () => ({
  redirectTo: jest.fn(),
}));

describe("StaffProfileSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default identity details and signs out", async () => {
    const user = userEvent.setup();

    render(<StaffProfileSettings user={{}} />);

    expect(
      screen.getByRole("heading", { name: /facility staff/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("facility_staff")).toBeInTheDocument();
    expect(screen.getByText(/no photo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(redirectTo).toHaveBeenCalledWith("/");
    });
  });

  it("renders supplied profile details", () => {
    render(
      <StaffProfileSettings
        user={{
          fullName: "Staff User",
          email: "staff@unisquare.edu",
          role: "facility_manager",
          avatarUrl: "https://example.com/staff.png",
          createdAt: "2026-04-01T08:00:00.000Z",
          lastSignInAt: "2026-05-11T10:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByAltText(/staff user avatar/i)).toBeInTheDocument();
    expect(screen.getAllByText("staff@unisquare.edu")).toHaveLength(2);
    expect(screen.getByText("facility_manager")).toBeInTheDocument();
  });
});
