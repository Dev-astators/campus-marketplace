import { supabase } from "../config/supabaseClient";

const ROLE_DASHBOARD_PATHS = {
  student: "/student-dashboard",
  facility_staff: "/facility-dashboard",
  admin: "/admin-dashboard",
};

export const getRoleDashboardPath = (role) =>
  ROLE_DASHBOARD_PATHS[role] || ROLE_DASHBOARD_PATHS.student;

export const isDashboardPath = (pathname) =>
  Object.values(ROLE_DASHBOARD_PATHS).includes(pathname);

export const resolveUserDashboardPath = async (user) => {
  if (!user?.id) {
    return ROLE_DASHBOARD_PATHS.student;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    const metadataRole = user.user_metadata?.role;
    return getRoleDashboardPath(metadataRole);
  }

  return getRoleDashboardPath(data?.role);
};
