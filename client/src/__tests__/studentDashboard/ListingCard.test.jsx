import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import ListingCard from "../../components/studentDashboard/ListingCard";

const originalBaseUrl = process.env.VITE_SUPABASE_URL;

describe("ListingCard", () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = "https://example.test";
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.VITE_SUPABASE_URL;
      return;
    }

    process.env.VITE_SUPABASE_URL = originalBaseUrl;
  });

  it("renders listing details with a formatted condition", () => {
    const listing = {
      id: "listing-123",
      title: "Desk Lamp",
      price: 120,
      condition: "like_new",
      listing_images: [{ storage_path: "lamp.jpg" }],
    };

    render(
      <MemoryRouter>
        <ListingCard listing={listing} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", {
      name: /view details for desk lamp/i,
    });

    expect(link).toHaveAttribute("href", "/listing/listing-123");
    expect(screen.getByText("Desk Lamp")).toBeInTheDocument();
    expect(screen.getByText("R120")).toBeInTheDocument();
    expect(screen.getByText("Like New")).toBeInTheDocument();

    const image = screen.getByAltText("Desk Lamp");
    expect(image).toHaveAttribute(
      "src",
      "https://example.test/storage/v1/object/public/listing-images/lamp.jpg",
    );
  });
});
