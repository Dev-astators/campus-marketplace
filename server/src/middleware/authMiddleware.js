const { supabase } = require('../config/supabaseClient');


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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorised: no token provided' });
    }

    // Pull the token out of "Bearer <token>".
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorised: malformed token' });
    }

    // Verify the token with Supabase.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Unauthorised: invalid or expired token' });
    }

    // Attach the verified user to the request for downstream handlers.
    req.user = data.user;
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error during authentication' });
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
        return res.status(401).json({ message: 'Unauthorised: no user on request' });
      }

      // Fetch the user's profile to get their role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !data) {
        return res.status(500).json({ message: 'Could not retrieve user profile' });
      }

      // Check if their role is in the allowed list
      if (!allowedRoles.includes(data.role)) {
        return res.status(403).json({
          message: `Forbidden: requires one of [${allowedRoles.join(', ')}] but got [${data.role}]`,
        });
      }

      // Attach role to req for use in route handlers
      req.userRole = data.role;

      next();

    } catch (err) {
      return res.status(500).json({ message: 'Internal server error during authorisation' });
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
      return res.status(401).json({ message: 'Unauthorised: no user on request' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_number, university, role, average_rating')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Profile not found: please complete onboarding' });
    }

    // Attach profile to request for use in downstream middleware and route handlers
    req.profile = data;

    next();

  } catch (err) {
    return res.status(500).json({ message: 'Internal server error while fetching profile' });
  }
};

module.exports = { verifySession, requireRole ,attachProfile};
