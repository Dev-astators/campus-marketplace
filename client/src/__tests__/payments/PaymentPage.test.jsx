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
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("confirms payment and asks the buyer to wait for drop-off", async () => {
    global.fetch.mockResolvedValueOnce(
      createFetchResponse({ status: "confirmed" }),
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
});
