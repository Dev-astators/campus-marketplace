import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import BuyButton from "../../components/listingDetails/BuyButton";
import { supabase } from "../../config/supabaseClient";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

describe("BuyButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
    jest.useRealTimers();
  });

  it("shows an error when the user is not signed in", async () => {
    const user = userEvent.setup();

    render(
      <BuyButton listing={{ id: "listing-1", price: 120, status: "active" }} />,
    );

    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /must be signed in/i,
    );
  });

  it("submits the PayFast form on success", async () => {
    const user = userEvent.setup();
    const submitSpy = jest
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "user-1" },
        error: null,
      }),
    });

    global.fetch.mockResolvedValueOnce(
      createFetchResponse({
        cashShortfall: 0,
        payfast: {
          url: "https://payfast.example",
          fields: { merchant_id: "123" },
        },
      }),
    );

    render(
      <BuyButton listing={{ id: "listing-1", price: 120, status: "active" }} />,
    );

    await user.click(screen.getByRole("button", { name: /buy now/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
    });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/payments/initiate");
    expect(JSON.parse(options.body)).toMatchObject({
      listingId: "listing-1",
      buyerId: "user-1",
    });

    submitSpy.mockRestore();
  });

  it("validates partial payments before initiating checkout", async () => {
    const user = userEvent.setup();
    const submitSpy = jest
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "user-1" },
        error: null,
      }),
    });
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({
        cashShortfall: 70,
        payfast: {
          url: "https://payfast.example",
          fields: { merchant_id: "123" },
        },
      }),
    );

    render(
      <BuyButton listing={{ id: "listing-1", price: 120, status: "active" }} />,
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: /i can't pay the full amount online/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /at least r1\.00/i,
    );

    await user.type(screen.getByLabelText(/how much can you pay online/i), "200");
    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /cannot exceed r120\.00/i,
    );

    await user.clear(screen.getByLabelText(/how much can you pay online/i));
    await user.type(screen.getByLabelText(/how much can you pay online/i), "50");
    await user.click(screen.getByRole("button", { name: /pay r50\.00/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      onlineAmount: 50,
    });

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled();
    });

    submitSpy.mockRestore();
  });

  it("shows profile and payment initiation errors", async () => {
    const user = userEvent.setup();

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: "Missing profile" },
      }),
    });

    const { rerender } = render(
      <BuyButton listing={{ id: "listing-1", price: 120, status: "active" }} />,
    );

    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /profile not found/i,
    );

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: "user-1" },
        error: null,
      }),
    });
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ error: "Sold already" }, false),
    );

    rerender(
      <BuyButton listing={{ id: "listing-2", price: 90, status: "active" }} />,
    );

    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/sold already/i);
  });

  it("disables purchasing for inactive listings", () => {
    render(
      <BuyButton listing={{ id: "listing-1", price: 120, status: "sold" }} />,
    );

    expect(
      screen.getByRole("button", { name: /no longer available/i }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("checkbox", {
        name: /i can't pay the full amount online/i,
      }),
    ).not.toBeInTheDocument();
  });
});
