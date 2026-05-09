import { useCallback, useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

function getFirstName(authUser) {
  const metadata = authUser?.user_metadata ?? {};
  const candidateName = metadata.full_name;

  if (typeof candidateName === "string" && candidateName.trim()) {
    return candidateName.trim().split(/\s+/)[0];
  }

  const emailPrefix = authUser?.email?.split("@")[0];
  if (emailPrefix) {
    return emailPrefix;
  }

  return "Student";
}

export default function useDashboardListings(activeNav) {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) return;

      const metadata = data.session.user.user_metadata ?? {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        data.session.user.email?.split("@")[0] ||
        "Student";

      setUser({
        name: getFirstName(data.session.user),
        fullName,
        id: data.session.user.id,
        email: data.session.user.email,
        studentNumber: data.session.user.email?.split("@")[0] || null,
        role: metadata.role || "student",
        provider: data.session.user.app_metadata?.provider || "google",
        createdAt: data.session.user.created_at,
        lastSignInAt: data.session.user.last_sign_in_at,
        avatarUrl: metadata.avatar_url || metadata.picture || null,
      });
    };

    getUser();
  }, []);

  const fetchListings = useCallback(async (navItem, currentUserId) => {
    if (navItem === "my-listings" && !currentUserId) {
      setListings([]);
      setLoading(false);
      return;
    }

    const endpoint =
      navItem === "my-listings"
        ? `${API_BASE_URL}/api/listings/my/${currentUserId}`
        : `${API_BASE_URL}/api/listings`;

    setLoading(true);

    try {
      let requestOptions = undefined;

      if (navItem === "my-listings") {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        if (!accessToken) {
          throw new Error("Missing access token for My Listings");
        }

        requestOptions = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        };
      }

      const res = await fetch(endpoint, requestOptions);

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

  // ✅ FIXED EFFECT (lint-safe)
  useEffect(() => {
    const run = async () => {
      await fetchListings(activeNav, user?.id);
    };

    run();
  }, [activeNav, user?.id, fetchListings]);

  return {
    user,
    listings,
    loading,
  };
}
