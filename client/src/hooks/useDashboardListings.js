import { useCallback, useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

// Encapsulates dashboard data concerns:
// 1) current authenticated user
// 2) listings fetch for marketplace vs my-listings tab
export default function useDashboardListings(activeNav) {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session is read once on mount; tab changes do not require re-reading auth.
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) return;

      setUser({
        name: data.session.user.email,
        id: data.session.user.id,
      });
    };

    getUser();
  }, []);

  const fetchListings = useCallback(async (navItem, currentUserId) => {
    // My Listings depends on the logged-in user id. If unavailable, return empty state.
    if (navItem === "my-listings" && !currentUserId) {
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
      const res = await fetch(endpoint);

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
  }, []);

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
