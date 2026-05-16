import { supabase } from "../config/supabaseClient";

const ROLE_DASHBOARD_PATHS = {
  student: "/student-dashboard",
  facility_staff: "/facility-dashboard",
  admin: "/admin-dashboard",
};

const buildFacilityDashboardPath = (facilityId) =>
  facilityId
    ? `${ROLE_DASHBOARD_PATHS.facility_staff}/${facilityId}`
    : ROLE_DASHBOARD_PATHS.facility_staff;

export const getRoleDashboardPath = (role) =>
  ROLE_DASHBOARD_PATHS[role] || ROLE_DASHBOARD_PATHS.student;

export const isDashboardPath = (pathname) =>
  pathname === ROLE_DASHBOARD_PATHS.student ||
  pathname === ROLE_DASHBOARD_PATHS.admin ||
  pathname === ROLE_DASHBOARD_PATHS.facility_staff ||
  pathname.startsWith(`${ROLE_DASHBOARD_PATHS.facility_staff}/`);

export const resolveUserDashboardPath = async (user) => {
  if (!user?.id) {
    return ROLE_DASHBOARD_PATHS.student;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, facility_id")
    .eq("id", user.id)
    .single();

  if (error) {
    const metadataRole = user.user_metadata?.role;
    const metadataFacilityId = user.user_metadata?.facility_id;

    if (metadataRole === "facility_staff") {
      return buildFacilityDashboardPath(metadataFacilityId);
    }

    return getRoleDashboardPath(metadataRole);
  }

  if (data?.role === "facility_staff") {
    return buildFacilityDashboardPath(data.facility_id);
  }

  return getRoleDashboardPath(data?.role);
};
