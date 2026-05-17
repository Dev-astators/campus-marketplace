import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import SellerProfilePage from "../../pages/SellerProfilePage";

const mockGetSession = jest.fn();

jest.mock("../../config/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

jest.mock("../../components/studentDashboard/Navbar", () => () => (
  <header>Mock navbar</header>
));

jest.mock("../../components/studentDashboard/ListingsGrid", () => (props) => (
  <section>
    <p>Listings count: {props.listings.length}</p>
    <p>Loading: {String(props.loading)}</p>
  </section>
));

describe("SellerProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            email: "buyer@example.com",
            user_metadata: {
              full_name: "Buyer Person",
            },
          },
        },
      },
    });
    global.fetch = jest.fn();
  });

  it("loads the seller profile and active listings from the API", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        seller: {
          id: "seller-1",
          full_name: "Alex Chen",
          average_rating: 4.5,
          total_ratings: 12,
        },
        listings: [
          { id: "listing-1", title: "Camera" },
          { id: "listing-2", title: "Tripod" },
        ],
      }),
    });

    render(
      <MemoryRouter initialEntries={["/seller-profile/seller-1"]}>
        <Routes>
          <Route
            path="/seller-profile/:sellerId"
            element={<SellerProfilePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /alex chen/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/rating 4.5 \(12 reviews\)/i)).toBeInTheDocument();
    expect(screen.getByText(/listings count: 2/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/listings/seller/seller-1"),
      );
    });
  });

  it("renders an error message when the seller request fails", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Seller not found",
      }),
    });

    render(
      <MemoryRouter initialEntries={["/seller-profile/missing-seller"]}>
        <Routes>
          <Route
            path="/seller-profile/:sellerId"
            element={<SellerProfilePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/seller not found/i)).toBeInTheDocument();
  });
});
