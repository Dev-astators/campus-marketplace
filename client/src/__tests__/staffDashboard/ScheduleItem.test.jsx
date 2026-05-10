import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ScheduleItem from "../../components/staff-dashboard/ScheduleItem";

describe("ScheduleItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the meetup details and toggles the checked state", async () => {
    const user = userEvent.setup();

    render(
      <ScheduleItem
        time="10:30"
        period="AM"
        item="Organic Chemistry Textbook"
        seller="Sarah Jenkins"
        buyer="Marcus Wei"
        booth="Booth A-4"
        boothVariant="green"
      />,
    );

    const actionButton = screen.getByRole("button");

    expect(screen.getByText("10:30")).toBeInTheDocument();
    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(
      screen.getByText(/organic chemistry textbook/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sarah jenkins/i)).toBeInTheDocument();
    expect(screen.getByText(/marcus wei/i)).toBeInTheDocument();
    expect(screen.getByText(/booth a-4/i)).toBeInTheDocument();
    expect(actionButton).toHaveClass("bg-slate-100");

    await user.click(actionButton);

    expect(actionButton).toHaveClass("bg-green-600");
  });
});
