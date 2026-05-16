import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ListingReadOnlyDetails from "../../components/listingDetails/ListingReadOnlyDetails";

describe("ListingReadOnlyDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the listing details with formatted labels", () => {
    render(
      <ListingReadOnlyDetails
        listing={{
          description: "Mirrorless camera body in excellent condition.",
          price: 18500,
          condition: "like_new",
          category: "Electronics",
          listing_type: "sale",
        }}
      />,
    );

    expect(
      screen.getByText(/mirrorless camera body in excellent condition/i),
    ).toBeInTheDocument();
    expect(screen.getByText("R18500")).toBeInTheDocument();
    expect(screen.getByText("Like New")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("falls back to an em dash when string labels are missing", () => {
    render(
      <ListingReadOnlyDetails
        listing={{
          description: "Basic study chair.",
          price: 450,
          condition: null,
          category: "Furniture",
          listing_type: "",
        }}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
