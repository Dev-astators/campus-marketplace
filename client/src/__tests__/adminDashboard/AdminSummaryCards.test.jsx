import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "@jest/globals";
import AdminSummaryCards from "../../components/adminDashboard/AdminSummaryCards";

describe("AdminSummaryCards", () => {
  it("renders summary card values", () => {
    const cards = [
      {
        title: "Active Listings",
        value: "128",
        trend: "+6% vs last week",
      },
      {
        title: "Pending Moderation",
        value: "3",
        trend: "Needs review",
      },
    ];

    render(<AdminSummaryCards cards={cards} />);

    expect(screen.getByText("Active Listings")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Needs review")).toBeInTheDocument();
  });
});
