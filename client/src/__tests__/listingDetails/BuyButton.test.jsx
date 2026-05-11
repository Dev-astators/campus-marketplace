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
});
