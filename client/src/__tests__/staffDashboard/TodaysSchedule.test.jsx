import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import TodaysSchedule from "../../components/staff-dashboard/TodaysSchedule";

describe("TodaysSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the schedule header and upcoming meetups", () => {
    render(<TodaysSchedule />);

    expect(
      screen.getByRole("heading", { name: /today's schedule/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view all/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/organic chemistry textbook/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ergonomic office chair/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/graphing calculator ti-84/i),
    ).toBeInTheDocument();
  });
});
