import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import ListingsGrid from "../../components/studentDashboard/ListingsGrid";

jest.mock("../../components/studentDashboard/ListingCard", () => ({
  __esModule: true,
  default: ({ listing }) => (
    <article data-testid="listing-card">{listing.title}</article>
  ),
}));

describe("ListingsGrid", () => {
  it("shows loading skeletons", () => {
    render(<ListingsGrid loading listings={[]} />);

    expect(screen.getByLabelText(/loading listings/i)).toBeInTheDocument();
    expect(screen.getAllByRole("article", { hidden: true })).toHaveLength(8);
  });

  it("shows the empty state", () => {
    render(<ListingsGrid listings={[]} loading={false} />);

    expect(screen.getByText(/no listings found/i)).toBeInTheDocument();
  });

  it("renders listing cards", () => {
    render(
      <ListingsGrid
        listings={[
          { id: "listing-1", title: "Desk Lamp" },
          { id: "listing-2", title: "Calculator" },
        ]}
        loading={false}
      />,
    );

    expect(screen.getAllByTestId("listing-card")).toHaveLength(2);
  });
});
