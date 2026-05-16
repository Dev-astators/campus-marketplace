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
import { MemoryRouter } from "react-router-dom";
import InAppNotifications from "../../components/studentDashboard/InAppNotifications";

const createFetchResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

describe("InAppNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  it("marks all notifications as read", async () => {
    const user = userEvent.setup();

    const notifications = [
      {
        id: "notif-1",
        type: "sale",
        title: "Sale confirmed",
        message: "Your item sold.",
        created_at: "2026-05-11T10:00:00.000Z",
        is_read: false,
        related_transaction_id: "tx-1",
      },
      {
        id: "notif-2",
        type: "purchase",
        title: "Purchase confirmed",
        message: "Payment received.",
        created_at: "2026-05-11T09:00:00.000Z",
        is_read: true,
        related_transaction_id: "tx-2",
      },
    ];

    global.fetch
      .mockResolvedValueOnce(createFetchResponse(notifications))
      .mockResolvedValue(createFetchResponse({ ok: true }));

    render(
      <MemoryRouter>
        <InAppNotifications profileId="user-1" />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /notifications/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText(/loading notifications/i),
      ).not.toBeInTheDocument();
    });

    expect(await screen.findByText(/unread/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /mark all as read/i }));

    await waitFor(() => {
      expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payments/notifications/notif-1/read"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
