import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/apiBaseUrl";
import { supabase } from "../config/supabaseClient";
import useProfile from "./useProfile";

// Encapsulates dashboard data concerns:
// 1) current authenticated user
// 2) listings fetch for marketplace vs my-listings tab
export default function useDashboardListings(activeNav) {
  const { profile, authUser, accessToken } = useProfile();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    if (!profile) return null;

    return {
      id: profile.id,
      authUserId: authUser?.id || profile.auth_user_id,
      email: profile.email || authUser?.email,
      fullName: profile.full_name || profile.email?.split("@")[0],
      avatarUrl: profile.avatar_url || null,
      role: profile.role,
      averageRating: profile.average_rating,
      totalRatings: profile.total_ratings,
      createdAt: profile.created_at,
    };
  }, [profile, authUser]);

  const fetchListings = useCallback(
    async (navItem, currentUserId) => {
      // My Listings depends on the logged-in user id. If unavailable, return empty state.
      if (navItem === "my-listings" && !currentUserId) {
        setListings([]);
        setLoading(false);
        return;
      }

      let token = accessToken;

      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || null;
      }

      if (!token) {
        setListings([]);
        setLoading(false);
        return;
      }

      // Choose API endpoint based on active dashboard tab.
      const endpoint =
        navItem === "my-listings"
          ? `${API_BASE_URL}/api/listings/my/${currentUserId}`
          : `${API_BASE_URL}/api/listings`;

      setLoading(true);

      try {
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch listings: ${res.status}`);
        }

        const data = await res.json();
        setListings(data.listings || []);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    // Refetch when tab changes or when user identity becomes available.
    fetchListings(activeNav, user?.id);
  }, [activeNav, user?.id, fetchListings]);

  return {
    user,
    listings,
    loading,
  };
}
