import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import VerificationQueue from "../../components/staff-dashboard/VerificationQueue";

describe("VerificationQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders pending verification items and updates their state", async () => {
    const user = userEvent.setup();

    render(<VerificationQueue />);

    expect(
      screen.getByRole("heading", { name: /verification queue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/canon eos r6 mark ii/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/calculus: early transcendentals/i),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /verify item/i })[0]);

    expect(
      screen.getByText(/item verified successfully/i),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /decline/i })[0]);

    expect(
      screen.queryByText(/calculus: early transcendentals/i),
    ).not.toBeInTheDocument();
  });
});
