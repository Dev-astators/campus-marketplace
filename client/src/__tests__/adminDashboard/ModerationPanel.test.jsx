import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, jest } from "@jest/globals";
import ModerationPanel from "../../components/adminDashboard/ModerationPanel";

describe("ModerationPanel", () => {
  it("renders flagged items and resolves a listing", async () => {
    const user = userEvent.setup();
    const handleResolveListing = jest.fn();
    const handleResolveReview = jest.fn();

    render(
      <ModerationPanel
        flaggedListings={[
          {
            id: "L-102",
            title: "Calculus Textbook",
            reason: "Potential counterfeit",
            reportedBy: "Student 284",
          },
        ]}
        flaggedReviews={[
          {
            id: "R-21",
            listing: "Desk Lamp",
            reason: "Abusive language",
            reportedBy: "Student 109",
          },
        ]}
        onResolveListing={handleResolveListing}
        onResolveReview={handleResolveReview}
      />,
    );

    const listingRow = screen.getByText("Calculus Textbook").closest("tr");
    const resolveButton = within(listingRow).getByRole("button", {
      name: /resolve/i,
    });

    await user.click(resolveButton);

    expect(handleResolveListing).toHaveBeenCalledWith("L-102");
    expect(handleResolveReview).not.toHaveBeenCalled();
  });
});
