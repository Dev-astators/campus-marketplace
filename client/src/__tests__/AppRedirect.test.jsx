import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../config/supabaseClient";

const mockResolveUserDashboardPath = jest.fn();
const mockIsDashboardPath = jest.fn();

jest.mock("../utils/roleRedirect", () => ({
  __esModule: true,
  isDashboardPath: (pathname) => mockIsDashboardPath(pathname),
  resolveUserDashboardPath: (user) => mockResolveUserDashboardPath(user),
}));

jest.mock("../pages/AdminDashboard", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("h1", null, "Admin Dashboard"),
  };
});

jest.mock("../pages/SignInPage", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("h1", null, "Sign In Page"),
  };
});

jest.mock("../pages/StudentDashboard", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("h1", null, "Student Dashboard"),
  };
});

import App from "../App";

describe("App auth redirects", () => {
  let unsubscribe;

  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, "", "/signin");
    unsubscribe = jest.fn();
    mockResolveUserDashboardPath.mockResolvedValue("/admin-dashboard");
    mockIsDashboardPath.mockImplementation((pathname) =>
      ["/student-dashboard", "/admin-dashboard", "/facility-dashboard"].includes(
        pathname,
      ),
    );
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      callback("SIGNED_IN", { user: { id: "admin-1" } });
      return {
        data: {
          subscription: { unsubscribe },
        },
      };
    });
  });

  it("redirects a signed-in user away from auth entry routes", async () => {
    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/admin-dashboard");
    });

    expect(mockResolveUserDashboardPath).toHaveBeenCalledWith({
      id: "admin-1",
    });
    expect(screen.getByRole("heading", { name: /admin dashboard/i }))
      .toBeInTheDocument();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("redirects a signed-in user away from the wrong dashboard", async () => {
    window.history.pushState({}, "", "/student-dashboard");

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/admin-dashboard");
    });

    expect(mockIsDashboardPath).toHaveBeenCalledWith("/student-dashboard");
    expect(screen.getByRole("heading", { name: /admin dashboard/i }))
      .toBeInTheDocument();
  });
});
