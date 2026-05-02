import { useEffect, useRef, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

export default function useProfile() {
  const [profile, setProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const buildProfileFallback = (user) => {
      if (!user) return null;

      const metadata = user.user_metadata || user.raw_user_meta_data || {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        `${metadata.given_name ?? ""} ${metadata.family_name ?? ""}`.trim() ||
        user.email;

      return {
        id: user.id,
        auth_user_id: user.id,
        full_name: fullName || "Student",
        email: user.email,
        student_number: user.email ? user.email.split("@")[0] : null,
        university: metadata.university || "University of the Witwatersrand",
        role: metadata.role || "student",
        average_rating: 0,
        total_ratings: 0,
        created_at: user.created_at,
        avatar_url:
          metadata.avatar_url || metadata.picture || metadata.image || null,
      };
    };

    const loadProfile = async (session) => {
      let resolvedSession = session;

      if (!resolvedSession) {
        const { data } = await supabase.auth.getSession();
        resolvedSession = data.session || null;
      }

      const user = resolvedSession?.user || null;

      if (!isMountedRef.current) return;

      setAuthUser(user);
      let token = resolvedSession?.access_token || null;

      if (!token && user) {
        const { data: refreshed, error: refreshError } =
          await supabase.auth.refreshSession();
        if (!refreshError) {
          token = refreshed.session?.access_token || null;
        }
      }

      setAccessToken(token);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!token) {
        setProfile(buildProfileFallback(user));
        setLoading(false);
        return;
      }

      const metadata = user.user_metadata || user.raw_user_meta_data || {};
      const avatarUrl =
        metadata.avatar_url || metadata.picture || metadata.image || null;

      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          const { data: refreshed, error: refreshError } =
            await supabase.auth.refreshSession();
          if (!refreshError) {
            token = refreshed.session?.access_token || token;
            setAccessToken(token);
          }

          const retry = await fetch(`${API_BASE_URL}/api/profile/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!retry.ok) {
            const text = await retry.text();
            throw new Error(text || "Failed to load profile");
          }

          const data = await retry.json();
          const profileData = data.profile || null;

          if (!isMountedRef.current) return;

          if (!profileData) {
            setProfile(buildProfileFallback(user));
          } else {
            setProfile({
              ...profileData,
              avatar_url: avatarUrl,
            });
          }

          setLoading(false);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load profile");
        }

        const data = await res.json();
        const profileData = data.profile || null;

        if (!isMountedRef.current) return;

        if (!profileData) {
          setProfile(buildProfileFallback(user));
        } else {
          setProfile({
            ...profileData,
            avatar_url: avatarUrl,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setProfile(buildProfileFallback(user));
      }

      setLoading(false);
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      await loadProfile(data.session || null);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true);
        loadProfile(session);
      },
    );

    return () => {
      isMountedRef.current = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    profile,
    authUser,
    accessToken,
    loading,
  };
}
