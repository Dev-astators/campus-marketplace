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

  it("resolves a flagged review", async () => {
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

    const reviewRow = screen.getByText("Desk Lamp").closest("tr");

    await user.click(
      within(reviewRow).getByRole("button", { name: /resolve/i }),
    );

    expect(handleResolveReview).toHaveBeenCalledWith("R-21");
    expect(handleResolveListing).not.toHaveBeenCalled();
  });

  it("renders empty states when nothing is flagged", () => {
    render(
      <ModerationPanel
        flaggedListings={[]}
        flaggedReviews={[]}
        onResolveListing={jest.fn()}
        onResolveReview={jest.fn()}
      />,
    );

    expect(screen.getByText(/no flagged listings/i)).toBeInTheDocument();
    expect(screen.getByText(/no flagged reviews/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view policy/i }),
    ).toBeInTheDocument();
  });
});
