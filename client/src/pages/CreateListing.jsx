import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";
import useProfile from "../hooks/useProfile";

export default function CreateListing() {
  const navigate = useNavigate();
  const { profile, accessToken } = useProfile();
  const [image, setImage] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Textbooks",
    condition: "good",
    askingPrice: "",
    listingType: "sale",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id || !accessToken) {
      alert("You must be logged in");
      return;
    }

    try {
      // Persist the listing first, then attach image metadata if upload succeeds.
      const res = await fetch(`${API_BASE_URL}/api/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          askingPrice: Number(form.askingPrice),
        }),
      });

      const dataRes = await res.json();

      if (!res.ok) {
        console.error(dataRes);
        alert("Failed to create listing");
        return;
      }

      const listingId = dataRes.listing.id;

      // 2️⃣ Upload image (if exists)
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${listingId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(fileName, image);

        if (uploadError) {
          console.error(uploadError);
          alert("Image upload failed");
          return;
        }

        // 3️⃣ Save image path in DB
        await fetch(`${API_BASE_URL}/api/listings/${listingId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            storage_path: fileName,
          }),
        });
      }

      navigate("/student-dashboard");
    } catch (err) {
      console.error(err);
      alert("Error creating listing");
    }
  };

  return (
    <main className="p-8 max-w-xl mx-auto" aria-label="Create listing page">
      <header>
        <h1 className="text-2xl font-bold mb-6">Create Listing</h1>
      </header>

      <section aria-label="Listing form">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="border p-2 rounded"
          />

          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option>Textbooks</option>
            <option>Electronics</option>
            <option>Furniture</option>
            <option>Clothing</option>
          </select>

          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>

          <input
            name="askingPrice"
            type="number"
            placeholder="Price (ZAR)"
            value={form.askingPrice}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />

          <select
            name="listingType"
            value={form.listingType}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="sale">Sale</option>
            <option value="trade">Trade</option>
            <option value="both">Both</option>
          </select>

          <button type="submit" className="bg-blue-600 text-white py-2 rounded">
            Create Listing
          </button>
        </form>
      </section>
    </main>
  );
}
