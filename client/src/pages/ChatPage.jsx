import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Chat from "../components/Chat";

export default function ChatPage() {
  const { id } = useParams();

  const [senderId, setSenderId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [listingTitle, setListingTitle] = useState("");
  const [sellerName, setSellerName] = useState("");

  // ✅ Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setSenderId(data.session?.user?.id);
    };

    getUser();
  }, []);

  // ✅ FETCH FROM YOUR BACKEND (same as ListingDetails.jsx)
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/listings/${id}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch listing");
        }

        const data = await res.json();

        const listing = data.listing;

        // ✅ THESE MATCH YOUR WORKING PAGE
        setListingTitle(listing.title);
        setReceiverId(listing.seller?.id);
        setSellerName(listing.seller?.full_name || "Seller");

      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    if (id) fetchListing();
  }, [id]);

  if (!senderId || !receiverId || !listingTitle) {
    return <p className="p-6">Loading chat...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      
      {/* ✅ HEADER (NOW SAME AS LISTING PAGE) */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #ccc",
          background: "#fff",
        }}
      >
        <h3 style={{ margin: 0 }}>
          👤 {sellerName}
        </h3>

        <p style={{ margin: 0, fontSize: "14px", color: "gray" }}>
          📦 {listingTitle}
        </p>
      </div>

      {/* Chat */}
      <div style={{ flex: 1 }}>
        <Chat
          senderId={senderId}
          receiverId={receiverId}
          listingId={id}
        />
      </div>
    </div>
  );
}