import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import CreateListing from "../pages/CreateListing";

describe("CreateListing", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestion: {
          low: 470,
          high: 530,
          annualChangePercent: 6,
          cpiIndex: 175.3,
          referenceDate: "2024-12",
        },
      }),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows a CPI-based price suggestion when the user enters a price", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    const priceInput = screen.getByLabelText(/asking price \(zar\)/i);
    await user.type(priceInput, "500");

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/listings/suggested-price?"),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    expect(await screen.findByText(/R\s*470,00/i)).toBeInTheDocument();
    expect(screen.getByText(/R\s*530,00/i)).toBeInTheDocument();
    expect(screen.getByText("2024-12")).toBeInTheDocument();
    expect(screen.getByText("175.3")).toBeInTheDocument();
  });
});
