import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import useListingFilters from "../../hooks/useListingFilters";

const listings = [
  {
    id: "listing-1",
    title: "Laptop",
    description: "High-performance study laptop",
    category: "Electronics",
    condition: "good",
    price: 2500,
    created_at: "2026-05-09T10:00:00.000Z",
  },
  {
    id: "listing-2",
    title: "Algebra Textbook",
    description: "Like new semester textbook",
    category: "Textbooks",
    condition: "like_new",
    price: 300,
    created_at: "2026-05-10T10:00:00.000Z",
  },
  {
    id: "listing-3",
    title: "Desk Lamp",
    description: "Bright lamp for dorm desks",
    category: "Electronics",
    condition: "new",
    price: 150,
    created_at: "2026-05-08T10:00:00.000Z",
  },
  {
    id: "listing-4",
    title: "Chemistry Notes",
    description: "Annotated lab notes",
    category: "Textbooks",
    condition: "good",
    price: "unknown",
    created_at: "2026-05-07T10:00:00.000Z",
  },
];

function HookHarness({ activeNav = "marketplace" }) {
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedCondition,
    setSelectedCondition,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    clearFilters,
    filteredListings,
    listingsHeading,
  } = useListingFilters({ listings, activeNav });

  return (
    <section>
      <p data-testid="heading">{listingsHeading}</p>
      <p data-testid="search">{search}</p>
      <p data-testid="category">{selectedCategory}</p>
      <p data-testid="condition">{selectedCondition}</p>
      <p data-testid="min-price">{minPrice}</p>
      <p data-testid="max-price">{maxPrice}</p>
      <p data-testid="sort-by">{sortBy}</p>
      <p data-testid="titles">
        {filteredListings.map((listing) => listing.title).join("|")}
      </p>

      <button type="button" onClick={() => setSearch("textbook")}>
        Search textbook
      </button>
      <button type="button" onClick={() => setSelectedCategory("Textbooks")}>
        Filter textbooks
      </button>
      <button type="button" onClick={() => setSelectedCondition("like_new")}>
        Filter like new
      </button>
      <button type="button" onClick={() => setMinPrice("200")}>
        Set min price
      </button>
      <button type="button" onClick={() => setMaxPrice("1000")}>
        Set max price
      </button>
      <button type="button" onClick={() => setSortBy("oldest")}>
        Sort oldest
      </button>
      <button type="button" onClick={() => setSortBy("price_low_high")}>
        Sort low high
      </button>
      <button type="button" onClick={() => setSortBy("price_high_low")}>
        Sort high low
      </button>
      <button type="button" onClick={() => setSortBy("title_az")}>
        Sort title
      </button>
      <button type="button" onClick={clearFilters}>
        Clear filters
      </button>
    </section>
  );
}

describe("useListingFilters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the correct default heading and newest sort order", () => {
    const { rerender } = render(<HookHarness activeNav="marketplace" />);

    expect(screen.getByTestId("heading")).toHaveTextContent(
      "Marketplace Listings",
    );
    expect(screen.getByTestId("titles")).toHaveTextContent(
      "Algebra Textbook|Laptop|Desk Lamp",
    );

    rerender(<HookHarness activeNav="my-listings" />);

    expect(screen.getByTestId("heading")).toHaveTextContent("My Listings");
  });

  it("filters listings by keyword, category, condition, and price range", async () => {
    const user = userEvent.setup();

    render(<HookHarness />);

    await user.click(screen.getByRole("button", { name: /search textbook/i }));
    await user.click(
      screen.getByRole("button", { name: /filter textbooks/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /filter like new/i }),
    );
    await user.click(screen.getByRole("button", { name: /set min price/i }));
    await user.click(screen.getByRole("button", { name: /set max price/i }));

    expect(screen.getByTestId("search")).toHaveTextContent("textbook");
    expect(screen.getByTestId("category")).toHaveTextContent("Textbooks");
    expect(screen.getByTestId("condition")).toHaveTextContent("like_new");
    expect(screen.getByTestId("min-price")).toHaveTextContent("200");
    expect(screen.getByTestId("max-price")).toHaveTextContent("1000");
    expect(screen.getByTestId("titles")).toHaveTextContent("Algebra Textbook");

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByTestId("search")).toBeEmptyDOMElement();
    expect(screen.getByTestId("category")).toHaveTextContent("All Categories");
    expect(screen.getByTestId("condition")).toHaveTextContent("all");
    expect(screen.getByTestId("min-price")).toBeEmptyDOMElement();
    expect(screen.getByTestId("max-price")).toBeEmptyDOMElement();
    expect(screen.getByTestId("sort-by")).toHaveTextContent("newest");
    expect(screen.getByTestId("titles")).toHaveTextContent(
      "Algebra Textbook|Laptop|Desk Lamp",
    );
  });

  it("supports the alternate sort modes", async () => {
    const user = userEvent.setup();

    render(<HookHarness />);

    await user.click(screen.getByRole("button", { name: /sort oldest/i }));
    expect(screen.getByTestId("titles")).toHaveTextContent(
      "Desk Lamp|Laptop|Algebra Textbook",
    );

    await user.click(screen.getByRole("button", { name: /sort low high/i }));
    expect(screen.getByTestId("titles")).toHaveTextContent(
      "Desk Lamp|Algebra Textbook|Laptop",
    );

    await user.click(screen.getByRole("button", { name: /sort high low/i }));
    expect(screen.getByTestId("titles")).toHaveTextContent(
      "Laptop|Algebra Textbook|Desk Lamp",
    );

    await user.click(screen.getByRole("button", { name: /sort title/i }));
    expect(screen.getByTestId("titles")).toHaveTextContent(
      "Algebra Textbook|Desk Lamp|Laptop",
    );
  });
});
