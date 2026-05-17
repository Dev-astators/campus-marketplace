import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ListingDetails from "../pages/ListingDetails";
import useListingDetails from "../hooks/useListingDetails";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  return {
    useParams: () => ({ id: "listing-1" }),
    useNavigate: () => mockNavigate,
    Link: ({ to, children, className }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

jest.mock("../hooks/useListingDetails");
jest.mock("../components/listingDetails/ListingEditForm", () => () => (
  <section>Mock edit form</section>
));
jest.mock("../components/listingDetails/ListingReadOnlyDetails", () => () => (
  <section>Mock read only details</section>
));
jest.mock("../components/listingDetails/ListingActions", () => (props) => (
  <section>
    <button type="button" onClick={props.onDelete}>
      Trigger delete
    </button>
    <button type="button" onClick={props.onContactSeller}>
      Trigger contact
    </button>
    <button type="button" onClick={props.onStartEdit}>
      Trigger edit
    </button>
  </section>
));

describe("ListingDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the loading state before the listing is available", () => {
    useListingDetails.mockReturnValue({
      listing: null,
      error: null,
      imageUrl: null,
      isOwner: false,
      isLoggedInBuyer: false,
      deleting: false,
      editing: false,
      saving: false,
      saveError: "",
      editForm: {},
      handleDelete: jest.fn(),
      handleEditChange: jest.fn(),
      handleStartEdit: jest.fn(),
      handleCancelEdit: jest.fn(),
      handleSaveEdit: jest.fn(),
    });

    render(<ListingDetails />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders error feedback when the hook returns an error", () => {
    useListingDetails.mockReturnValue({
      listing: null,
      error: "Failed to fetch listing",
      imageUrl: null,
      isOwner: false,
      isLoggedInBuyer: false,
      deleting: false,
      editing: false,
      saving: false,
      saveError: "",
      editForm: {},
      handleDelete: jest.fn(),
      handleEditChange: jest.fn(),
      handleStartEdit: jest.fn(),
      handleCancelEdit: jest.fn(),
      handleSaveEdit: jest.fn(),
    });

    render(<ListingDetails />);

    expect(
      screen.getByText(/error: failed to fetch listing/i),
    ).toBeInTheDocument();
  });

  it("renders listing details and navigates to the seller chat", async () => {
    const user = userEvent.setup();

    useListingDetails.mockReturnValue({
      listing: {
        id: "listing-1",
        title: "Canon EOS R6",
        seller: {
          id: "seller-1",
          full_name: "Alex Chen",
          average_rating: 4.5,
          total_ratings: 12,
        },
      },
      error: null,
      imageUrl: "https://example.com/canon.png",
      isOwner: false,
      isLoggedInBuyer: true,
      deleting: false,
      editing: false,
      saving: false,
      saveError: "",
      editForm: {},
      handleDelete: jest.fn(),
      handleEditChange: jest.fn(),
      handleStartEdit: jest.fn(),
      handleCancelEdit: jest.fn(),
      handleSaveEdit: jest.fn(),
    });

    render(<ListingDetails />);

    expect(
      screen.getByRole("heading", { name: /canon eos r6/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sold by/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /alex chen/i }),
    ).toHaveAttribute("href", "/seller-profile/seller-1");
    expect(screen.getByAltText(/listing/i)).toHaveAttribute(
      "src",
      "https://example.com/canon.png",
    );
    expect(screen.getByText("Mock read only details")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /trigger contact/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/chat/listing-1?seller=seller-1");
  });

  it("shows the edit form when editing is active", () => {
    useListingDetails.mockReturnValue({
      listing: {
        id: "listing-1",
        title: "Desk Lamp",
        seller: {
          id: "seller-2",
          full_name: "Lebo Molefe",
          average_rating: 4.1,
          total_ratings: 7,
        },
      },
      error: null,
      imageUrl: null,
      isOwner: true,
      isLoggedInBuyer: false,
      deleting: false,
      editing: true,
      saving: false,
      saveError: "",
      editForm: {},
      handleDelete: jest.fn(),
      handleEditChange: jest.fn(),
      handleStartEdit: jest.fn(),
      handleCancelEdit: jest.fn(),
      handleSaveEdit: jest.fn(),
    });

    render(<ListingDetails />);

    expect(screen.getByText("Mock edit form")).toBeInTheDocument();
    expect(
      screen.queryByText("Mock read only details"),
    ).not.toBeInTheDocument();
  });
});
