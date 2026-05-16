import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ListingsFiltersPanel from "../../components/studentDashboard/ListingsFiltersPanel";

describe("ListingsFiltersPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches controlled filter changes", async () => {
    const user = userEvent.setup();
    const onConditionChange = jest.fn();
    const onMinPriceChange = jest.fn();
    const onMaxPriceChange = jest.fn();
    const onSortByChange = jest.fn();
    const onClearFilters = jest.fn();

    render(
      <ListingsFiltersPanel
        selectedCondition="all"
        onConditionChange={onConditionChange}
        minPrice=""
        onMinPriceChange={onMinPriceChange}
        maxPrice=""
        onMaxPriceChange={onMaxPriceChange}
        sortBy="newest"
        onSortByChange={onSortByChange}
        onClearFilters={onClearFilters}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/condition/i), "like_new");
    await user.type(screen.getByLabelText(/min price/i), "100");
    await user.type(screen.getByLabelText(/max price/i), "500");
    await user.selectOptions(screen.getByLabelText(/sort by/i), "title_az");
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onConditionChange).toHaveBeenCalledWith("like_new");
    expect(onMinPriceChange).toHaveBeenCalledWith("1");
    expect(onMinPriceChange).toHaveBeenCalledWith("0");
    expect(onMinPriceChange).toHaveBeenCalledWith("0");
    expect(onMaxPriceChange).toHaveBeenCalledWith("5");
    expect(onMaxPriceChange).toHaveBeenCalledWith("0");
    expect(onMaxPriceChange).toHaveBeenCalledWith("0");
    expect(onSortByChange).toHaveBeenCalledWith("title_az");
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
