const { supabase } = require("../config/supabaseClient");

const DEFAULT_UNIVERSITY = "University of the Witwatersrand";
const DEFAULT_ROLE = "student";

const isMissingColumnError = (error, columnName) => {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return message.includes(columnName) || error.code === "42703";
};

const fetchProfileByAuthId = async (authUserId) => {
  let result = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (result.error && isMissingColumnError(result.error, "auth_user_id")) {
    result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUserId)
      .single();
  }

  return result;
};

const insertProfileForUser = async (payload) => {
  let result = await supabase
    .from("profiles")
    .insert(payload)
    .select("*")
    .single();

  if (result.error && isMissingColumnError(result.error, "auth_user_id")) {
    const { auth_user_id: _ignored, ...fallbackPayload } = payload;
    result = await supabase
      .from("profiles")
      .insert(fallbackPayload)
      .select("*")
      .single();
  }

  return result;
};

const buildProfilePayload = (user) => {
  const metadata = user?.user_metadata || user?.raw_user_meta_data || {};
  const email = user?.email || metadata.email || "";
  const fullName =
    metadata.full_name ||
    metadata.name ||
    `${metadata.given_name ?? ""} ${metadata.family_name ?? ""}`.trim() ||
    email;

  return {
    id: user?.id,
    auth_user_id: user?.id,
    full_name: fullName || "Student",
    email,
    student_number: email ? email.split("@")[0] : null,
    university: metadata.university || DEFAULT_UNIVERSITY,
    role: metadata.role || DEFAULT_ROLE,
  };
};

/**
 * verifySession middleware
 * Checks that the incoming request has a valid Supabase session token.
 * Attaches the authenticated user to req.user if valid.
 *
 * Expected header:
 *   Authorization: Bearer <supabase_jwt_token>
 *
 * Responds with:
 *   401 — if no token is provided or token is invalid/expired
 *   500 — if Supabase returns an unexpected error
 */

const verifySession = async (req, res, next) => {
  try {
    // Extract the auth header.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorised: no token provided" });
    }

    // Pull the token out of "Bearer <token>".
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorised: malformed token" });
    }

    // Verify the token with Supabase.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res
        .status(401)
        .json({ message: "Unauthorised: invalid or expired token" });
    }

    // Attach the verified user to the request for downstream handlers.
    req.user = data.user;
    return next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error during authentication" });
  }
};

/**
 * requireRole middleware factory
 * Checks that the authenticated user's role matches the required role(s).
 * Must be used AFTER verifySession since it depends on req.user.
 *
 * Usage:
 *   router.post('/', verifySession, requireRole('facility_staff'), handler)
 *   router.get('/admin', verifySession, requireRole('admin', 'facility_staff'), handler)
 *
 * Responds with:
 *   403 — if the user's role is not in the allowed roles
 *   500 — if the profile lookup fails
 */

const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // req.user is set by verifySession
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Unauthorised: no user on request" });
      }

      // Fetch the user's profile to get their role
      const { data, error } = await fetchProfileByAuthId(req.user.id);

      if (error || !data) {
        return res
          .status(500)
          .json({ message: "Could not retrieve user profile" });
      }

      const role = data?.role || DEFAULT_ROLE;

      // Check if their role is in the allowed list
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          message: `Forbidden: requires one of [${allowedRoles.join(", ")}] but got [${role}]`,
        });
      }

      // Attach role to req for use in route handlers
      req.userRole = role;

      next();
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Internal server error during authorisation" });
    }
  };
};

/**
 * attachProfile middleware
 * Fetches the authenticated user's profile from the profiles table
 * and attaches it to req.profile.
 * Must be used AFTER verifySession since it depends on req.user.
 *
 * Responds with:
 *   404 — if no profile exists for this user (onboarding not complete)
 *   500 — if the profile lookup fails
 */

const attachProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorised: no user on request" });
    }

    const { data, error } = await fetchProfileByAuthId(req.user.id);

    if (error || !data) {
      const payload = buildProfilePayload(req.user);

      const { data: createdProfile, error: createError } =
        await insertProfileForUser(payload);

      if (createError || !createdProfile) {
        console.error("Failed to create profile:", createError);
        return res.status(500).json({
          message: "Profile creation failed",
          error: createError?.message,
        });
      }

      req.profile = createdProfile;
      return next();
    }

    // Attach profile to request for use in downstream middleware and route handlers
    req.profile = data;

    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error while fetching profile" });
  }
};

module.exports = { verifySession, requireRole, attachProfile };
