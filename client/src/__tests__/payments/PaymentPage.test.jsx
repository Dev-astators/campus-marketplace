import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PaymentPage from "../../pages/PaymentPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

const renderPaymentPage = (path = "/payment/success?transaction_id=tx-1") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/payment/success"
          element={<PaymentPage result="success" />}
        />
      </Routes>
    </MemoryRouter>,
  );

const renderCancelledPaymentPage = () =>
  render(
    <MemoryRouter initialEntries={["/payment/success"]}>
      <Routes>
        <Route
          path="/payment/success"
          element={<PaymentPage result="cancel" />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("PaymentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    global.fetch = jest.fn();
    process.env.VITE_PAYFAST_SANDBOX = "true";
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch.mockReset();
    delete process.env.VITE_PAYFAST_SANDBOX;
  });

  it("confirms payment and asks the buyer to wait for drop-off", async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ ok: true }, true),  // confirm-dev succeeds
    );

    renderPaymentPage();

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/seller will book a drop-off slot/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /go to dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/student-dashboard");
  });

  it("renders the cancelled state", async () => {
    const user = userEvent.setup();

    renderCancelledPaymentPage();

    expect(screen.getByText(/payment cancelled/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to listing/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back to listing/i }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders the failed state when confirmation fails", async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ error: "Bad gateway" }, false),
    );

    renderPaymentPage();

    expect(await screen.findByText(/payment issue/i)).toBeInTheDocument();
    expect(screen.getByText(/bad gateway/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /go to dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/student-dashboard");
  });

  it("confirms a production payment from the status endpoint", async () => {
    process.env.VITE_PAYFAST_SANDBOX = "false";
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ status: "complete" }, true),
    );

    renderPaymentPage();

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payments/status/tx-1"),
    );
  });

  it("shows a failure when the status endpoint does not respond", async () => {
    process.env.VITE_PAYFAST_SANDBOX = "false";
    global.fetch.mockResolvedValueOnce(null);

    renderPaymentPage();

    expect(await screen.findByText(/payment issue/i)).toBeInTheDocument();
    expect(screen.getByText(/no response from server/i)).toBeInTheDocument();
  });

  it("shows the checking state while confirmation is still pending", async () => {
    let resolveFetch;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderPaymentPage();

    expect(
      screen.getByText(/confirming your payment/i),
    ).toBeInTheDocument();

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({}),
      });
    });

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
  });

  it("shows a pending state when production polling exhausts attempts", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    process.env.VITE_PAYFAST_SANDBOX = "false";
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "pending" }),
    });

    renderPaymentPage();

    expect(
      screen.getByText(/confirming your payment/i),
    ).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    for (let attempt = 0; attempt < 15; attempt += 1) {
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(screen.getByText(/almost there/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(16);

    await user.click(screen.getByRole("button", { name: /go to dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/student-dashboard");
  });
});
