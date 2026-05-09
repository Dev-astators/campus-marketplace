import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, jest } from "@jest/globals";
import AdminSidebar from "../../components/adminDashboard/AdminSidebar";

describe("AdminSidebar", () => {
  it("renders nav items and calls onNavigate", async () => {
    const user = userEvent.setup();
    const handleNavigate = jest.fn();
    const items = [
      { id: "overview", label: "Overview" },
      { id: "moderation", label: "Moderation", badge: 2 },
    ];

    render(
      <AdminSidebar
        items={items}
        activeItem="overview"
        onNavigate={handleNavigate}
      />,
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Moderation")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /moderation/i }));

    expect(handleNavigate).toHaveBeenCalledWith("moderation");
  });
});
