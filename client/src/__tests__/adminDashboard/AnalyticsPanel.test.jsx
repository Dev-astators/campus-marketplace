import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, jest } from "@jest/globals";
import AnalyticsPanel from "../../components/adminDashboard/AnalyticsPanel";

describe("AnalyticsPanel", () => {
  it("exports reports from the analytics cards", async () => {
    const user = userEvent.setup();
    const handleExportCsv = jest.fn();
    const handleExportPdf = jest.fn();

    render(
      <AnalyticsPanel
        analytics={{
          popularCategories: [{ label: "Textbooks", count: 42 }],
          transactionsOverTime: [{ label: "Jan", count: 24 }],
          facilityUtilization: { booked: 5, capacity: 10 },
          flaggedSummary: { listings: 2, reviews: 3, messages: 1 },
        }}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />,
    );

    const categoriesCard = screen
      .getByRole("heading", { name: /popular categories/i })
      .closest("article");

    await user.click(
      within(categoriesCard).getByRole("button", { name: /export csv/i }),
    );

    const transactionsCard = screen
      .getByRole("heading", { name: /transactions over time/i })
      .closest("article");

    await user.click(
      within(transactionsCard).getByRole("button", { name: /export pdf/i }),
    );

    expect(handleExportCsv).toHaveBeenCalledWith("categories");
    expect(handleExportPdf).toHaveBeenCalledWith("transactions");
  });

  it("renders all analytics sections and exports the remaining reports", async () => {
    const user = userEvent.setup();
    const handleExportCsv = jest.fn();
    const handleExportPdf = jest.fn();

    render(
      <AnalyticsPanel
        analytics={{
          popularCategories: [
            { label: "Textbooks", count: 42 },
            { label: "Electronics", count: 15 },
          ],
          transactionsOverTime: [
            { label: "Apr", count: 8 },
            { label: "May", count: 12 },
          ],
          facilityUtilization: { booked: 7, capacity: 10 },
          flaggedSummary: { listings: 2, reviews: 3, messages: 1 },
        }}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />,
    );

    expect(screen.getByText(/electronics/i)).toBeInTheDocument();
    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();

    const utilizationCard = screen
      .getByRole("heading", { name: /facility utilisation/i })
      .closest("article");
    const moderationCard = screen
      .getByRole("heading", { name: /flagged content summary/i })
      .closest("article");

    await user.click(
      within(utilizationCard).getByRole("button", { name: /export pdf/i }),
    );
    await user.click(
      within(moderationCard).getByRole("button", { name: /export csv/i }),
    );

    expect(handleExportPdf).toHaveBeenCalledWith("utilization");
    expect(handleExportCsv).toHaveBeenCalledWith("moderation");
  });
});
