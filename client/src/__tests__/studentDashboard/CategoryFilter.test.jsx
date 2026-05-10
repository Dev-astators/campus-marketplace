import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import CategoryFilter from "../../components/studentDashboard/CategoryFilter";

describe("CategoryFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders category buttons and reports the next selected value", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <CategoryFilter
        categories={["All Categories", "Textbooks", "Electronics"]}
        selected="Textbooks"
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole("button", { name: /textbooks/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /electronics/i }),
    ).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: /electronics/i }));

    expect(onSelect).toHaveBeenCalledWith("Electronics");
  });
});
