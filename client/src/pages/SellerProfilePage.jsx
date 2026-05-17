import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/studentDashboard/Navbar";
import ListingsGrid from "../components/studentDashboard/ListingsGrid";
import { API_BASE_URL } from "../config/apiBaseUrl";
import { supabase } from "../config/supabaseClient";

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SellerProfilePage() {
  const { sellerId } = useParams();
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data.session?.user;

      if (!authUser) {
        setUser(null);
        return;
      }

      setUser({
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "Student",
        avatarUrl:
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          null,
      });
    };

    getUser();
  }, []);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!sellerId) {
        setError("Seller profile could not be found.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/listings/seller/${sellerId}`,
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to fetch seller profile");
        }

        const payload = await response.json();
        setSeller(payload.seller || null);
        setListings(payload.listings || []);
        setError("");
      } catch (fetchError) {
        console.error("Failed to fetch seller profile:", fetchError);
        setSeller(null);
        setListings([]);
        setError(fetchError.message || "Failed to fetch seller profile");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, [sellerId]);

  const initials = useMemo(
    () => getInitials(seller?.full_name),
    [seller?.full_name],
  );

  return (
    <main
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Navbar user={user} />

      <article className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb">
          <p className="text-sm text-gray-500">
            <Link
              to="/student-dashboard"
              className="font-medium text-blue-700 underline-offset-4 hover:underline"
            >
              Marketplace
            </Link>{" "}
            / Seller profile
          </p>
        </nav>

        {error ? (
          <aside className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </aside>
        ) : null}

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <section className="flex items-center gap-4">
              <figure className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                <figcaption aria-label="Seller initials">{initials}</figcaption>
              </figure>

              <section>
                <h1 className="text-2xl font-bold text-gray-900">
                  {seller?.full_name || "Seller profile"}
                </h1>
                <p className="mt-2 text-sm font-medium text-yellow-600">
                  Rating {seller?.average_rating?.toFixed(1) || "0.0"} (
                  {seller?.total_ratings || 0} reviews)
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {loading
                    ? "Loading active seller profile..."
                    : `${listings.length} active listing${
                        listings.length === 1 ? "" : "s"
                      }`}
                </p>
              </section>
            </section>
          </header>
        </article>

        <section aria-labelledby="seller-active-listings-heading">
          <header className="mb-4">
            <h2
              id="seller-active-listings-heading"
              className="text-xl font-bold text-gray-900"
            >
              Active listings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse items currently being sold by this seller.
            </p>
          </header>

          <ListingsGrid listings={listings} loading={loading} />
        </section>
      </article>
    </main>
  );
}
