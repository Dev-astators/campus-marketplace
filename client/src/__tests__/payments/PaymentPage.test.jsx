import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
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
    global.fetch = jest.fn();
    process.env.VITE_PAYFAST_SANDBOX = "true";
  });

  afterEach(() => {
    global.fetch.mockReset();
    delete process.env.VITE_PAYFAST_SANDBOX;
  });

  it("confirms payment and asks the buyer to wait for drop-off", async () => {
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ ok: true }, true),  // confirm-dev succeeds
    );

    renderPaymentPage();

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/seller will book a drop-off slot/i),
    ).toBeInTheDocument();
  });

  it("renders the cancelled state", async () => {
    renderCancelledPaymentPage();

    expect(screen.getByText(/payment cancelled/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to listing/i }),
    ).toBeInTheDocument();
  });

  it("renders the failed state when confirmation fails", async () => {
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ error: "Bad gateway" }, false),
    );

    renderPaymentPage();

    expect(await screen.findByText(/payment issue/i)).toBeInTheDocument();
    expect(screen.getByText(/bad gateway/i)).toBeInTheDocument();
  });
});
