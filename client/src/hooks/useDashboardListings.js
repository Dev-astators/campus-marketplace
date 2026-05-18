// src/hooks/useDashboardListings.js
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
  if (emailPrefix) return emailPrefix;
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

      const authUser = data.session.user;
      const metadata = authUser.user_metadata ?? {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        authUser.email?.split("@")[0] ||
        "Student";

      // ✅ Fetch the profile row to get the profile UUID (different from auth id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", authUser.id) // profiles.id = auth.users.id in your schema
        .single();

      setUser({
        name: getFirstName(authUser),
        fullName,
        id: authUser.id, // auth user id
        profileId: profile?.id || authUser.id, // profile table id
        email: authUser.email,
        studentNumber: authUser.email?.split("@")[0] || null,
        role: profile?.role || metadata.role || "student",
        provider: authUser.app_metadata?.provider || "google",
        createdAt: authUser.created_at,
        lastSignInAt: authUser.last_sign_in_at,
        avatarUrl: metadata.avatar_url || metadata.picture || null,
      });
    };

    getUser();
  }, []);

  const fetchListings = useCallback(async (navItem, currentUserId) => {
    // These tabs don't use the listings fetch at all
    if (["my-purchases", "my-sales", "profile"].includes(navItem)) {
      setLoading(false);
      return;
    }

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
        if (!accessToken)
          throw new Error("Missing access token for My Listings");
        requestOptions = {
          headers: { Authorization: `Bearer ${accessToken}` },
        };
      }

      const res = await fetch(endpoint, requestOptions);
      if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
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
    const run = async () => {
      await fetchListings(activeNav, user?.id);
    };
    run();
  }, [activeNav, user?.id, fetchListings]);

  return { user, listings, loading };
}
