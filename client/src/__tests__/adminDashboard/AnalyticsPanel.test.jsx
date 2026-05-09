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
});
