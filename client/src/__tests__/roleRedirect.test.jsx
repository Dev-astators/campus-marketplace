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
    expect(isDashboardPath("/facility-dashboard/facility-1")).toBe(true);
    expect(isDashboardPath("/admin-dashboard")).toBe(true);
    expect(isDashboardPath("/signin")).toBe(false);
  });

  it("resolves a facility staff dashboard path from the stored profile", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: "facility_staff", facility_id: "facility-1" },
        error: null,
      }),
    });

    const result = await resolveUserDashboardPath({ id: "staff-1" });

    expect(result).toBe("/facility-dashboard/facility-1");
  });

  it("falls back to facility metadata when the profile lookup fails", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Profile unavailable" },
      }),
    });

    const result = await resolveUserDashboardPath({
      id: "staff-1",
      user_metadata: { role: "facility_staff", facility_id: "facility-9" },
    });

    expect(result).toBe("/facility-dashboard/facility-9");
  });

  it("keeps non-staff metadata fallback behavior unchanged", async () => {
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
