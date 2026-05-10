import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ListingEditForm from "../../components/listingDetails/ListingEditForm";

describe("ListingEditForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the controlled fields and dispatches changes and actions", async () => {
    const user = userEvent.setup();
    const onEditChange = jest.fn();
    const onSaveEdit = jest.fn((event) => event.preventDefault());
    const onCancelEdit = jest.fn();

    render(
      <ListingEditForm
        editForm={{
          title: "Canon EOS R6",
          description: "Mirrorless camera",
          askingPrice: "18500",
          category: "Electronics",
          condition: "good",
          listingType: "sale",
        }}
        onEditChange={onEditChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        saving={false}
        saveError=""
      />,
    );

    await user.type(screen.getByLabelText(/title/i), " updated");
    await user.type(screen.getByLabelText(/description/i), " body only");
    await user.type(screen.getByLabelText(/price \(zar\)/i), "0");
    await user.selectOptions(screen.getByLabelText(/category/i), "Furniture");
    await user.selectOptions(screen.getByLabelText(/^condition$/i), "fair");
    await user.selectOptions(screen.getByLabelText(/listing type/i), "trade");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onEditChange).toHaveBeenCalled();
    expect(onSaveEdit).toHaveBeenCalledTimes(1);
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("shows save state and validation feedback", () => {
    render(
      <ListingEditForm
        editForm={{
          title: "Desk",
          description: "Study desk",
          askingPrice: "900",
          category: "Furniture",
          condition: "good",
          listingType: "both",
        }}
        onEditChange={jest.fn()}
        onSaveEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        saving
        saveError="Failed to update listing"
      />,
    );

    expect(screen.getByText(/failed to update listing/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /saving/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
