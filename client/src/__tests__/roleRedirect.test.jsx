import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../config/supabaseClient";
import {
  getRoleDashboardPath,
  isDashboardPath,
  resolveUserDashboardPath,
} from "../utils/roleRedirect";

describe("roleRedirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps known roles to their dashboard paths", () => {
    expect(getRoleDashboardPath("student")).toBe("/student-dashboard");
    expect(getRoleDashboardPath("facility_staff")).toBe("/facility-dashboard");
    expect(getRoleDashboardPath("admin")).toBe("/admin-dashboard");
  });

  it("recognizes dashboard routes", () => {
    expect(isDashboardPath("/student-dashboard")).toBe(true);
    expect(isDashboardPath("/facility-dashboard")).toBe(true);
    expect(isDashboardPath("/admin-dashboard")).toBe(true);
    expect(isDashboardPath("/signin")).toBe(false);
  });

  it("resolves the dashboard path from the stored profile role", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: "facility_staff" },
        error: null,
      }),
    });

    const result = await resolveUserDashboardPath({ id: "staff-1" });

    expect(result).toBe("/facility-dashboard");
  });

  it("falls back to user metadata role when profile lookup fails", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Profile unavailable" },
      }),
    });

    const result = await resolveUserDashboardPath({
      id: "admin-1",
      user_metadata: { role: "admin" },
    });

    expect(result).toBe("/admin-dashboard");
  });
});
