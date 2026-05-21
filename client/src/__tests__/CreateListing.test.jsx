import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import CreateListing from "../pages/CreateListing";
import { supabase } from "../config/supabaseClient";

describe("CreateListing", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.alert = jest.fn();
    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "seller-1" } } },
    });
    supabase.storage = {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
      })),
    };
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

  it("shows the invalid price message for non-positive values", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    const priceInput = screen.getByLabelText(/asking price \(zar\)/i);
    await user.clear(priceInput);
    await user.type(priceInput, "0");

    expect(
      screen.getByText(/enter a valid positive price to get a suggestion/i),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("previews and removes an uploaded image", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const file = new File(["image"], "item.png", { type: "image/png" });

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    await user.upload(screen.getByLabelText(/listing image/i), file);

    expect(screen.getByText("item.png")).toBeInTheDocument();
    expect(screen.getByText("0.00 MB")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);

    await user.click(screen.getByRole("button", { name: /remove image/i }));

    expect(screen.getByText(/no image selected yet/i)).toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("alerts when an unauthenticated user tries to submit", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/title/i), "Campus Chair");
    await user.type(screen.getByLabelText(/asking price \(zar\)/i), "500");
    await user.click(screen.getByRole("button", { name: /^post item$/i }));

    expect(global.alert).toHaveBeenCalledWith("You must be logged in");
  });

  it("shows a loading state while posting the item", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    let resolveCreateListing;

    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveCreateListing = resolve;
        }),
    );

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/title/i), "Study Desk");
    await user.type(screen.getByLabelText(/asking price \(zar\)/i), "1200");
    await user.click(screen.getByRole("button", { name: /^post item$/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /posting your item/i,
    );
    expect(
      screen.getByRole("button", { name: /posting item/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    await act(async () => {
      resolveCreateListing({
        ok: true,
        json: async () => ({
          listing: { id: "listing-loading" },
        }),
      });
    });
  });

  it("submits a listing with an uploaded image", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const upload = jest.fn().mockResolvedValue({ error: null });
    const file = new File(["image"], "desk.png", { type: "image/png" });

    supabase.storage = {
      from: jest.fn(() => ({ upload })),
    };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          listing: { id: "listing-1" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    await user.upload(screen.getByLabelText(/listing image/i), file);
    await user.type(screen.getByLabelText(/title/i), "Study Desk");
    await user.type(screen.getByLabelText(/asking price \(zar\)/i), "1200");
    await user.click(screen.getByRole("button", { name: /^post item$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("/api/listings"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("\"sellerId\":\"seller-1\""),
        }),
      );
      expect(upload).toHaveBeenCalledWith("listing-1.png", file);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("/api/listings/listing-1/images"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows an alert when image upload fails", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const upload = jest.fn().mockResolvedValue({
      error: { message: "storage failed" },
    });
    const file = new File(["image"], "desk.png", { type: "image/png" });

    supabase.storage = {
      from: jest.fn(() => ({ upload })),
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        listing: { id: "listing-2" },
      }),
    });

    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>,
    );

    await user.upload(screen.getByLabelText(/listing image/i), file);
    await user.type(screen.getByLabelText(/title/i), "Lamp");
    await user.type(screen.getByLabelText(/asking price \(zar\)/i), "300");
    await user.click(screen.getByRole("button", { name: /^post item$/i }));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Image upload failed");
    });
  });
});
