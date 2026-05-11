import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ListingActions from "../../components/listingDetails/ListingActions";

describe("ListingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows owner actions and calls the edit and delete handlers", async () => {
    const user = userEvent.setup();
    const onStartEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <ListingActions
        listing={{ listing_type: "trade" }}
        isOwner
        editing={false}
        deleting={false}
        onStartEdit={onStartEdit}
        onDelete={onDelete}
        isLoggedInBuyer={false}
        onContactSeller={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /edit listing/i }));
    await user.click(screen.getByRole("button", { name: /delete listing/i }));

    expect(onStartEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("shows buyer contact actions and hides owner controls while editing", async () => {
    const user = userEvent.setup();
    const onContactSeller = jest.fn();

    render(
      <ListingActions
        listing={{ listing_type: "trade" }}
        isOwner={false}
        editing
        deleting
        onStartEdit={jest.fn()}
        onDelete={jest.fn()}
        isLoggedInBuyer
        onContactSeller={onContactSeller}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /edit listing/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete listing/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /contact seller/i }));

    expect(onContactSeller).toHaveBeenCalledTimes(1);
  });
});
