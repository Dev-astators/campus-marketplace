import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../config/supabaseClient";
import useDashboardListings from "../../hooks/useDashboardListings";

function HookHarness({ activeNav }) {
  const { user, listings, loading } = useDashboardListings(activeNav);

  return (
    <section>
      <p data-testid="user-name">{user?.name || ""}</p>
      <p data-testid="user-email">{user?.email || ""}</p>
      <p data-testid="listings-count">{listings.length}</p>
      <p data-testid="loading-state">{loading ? "loading" : "idle"}</p>
    </section>
  );
}

describe("useDashboardListings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("loads the signed-in user and marketplace listings", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "student-1",
            email: "ada@uni.edu",
            created_at: "2026-01-01T10:00:00.000Z",
            last_sign_in_at: "2026-05-10T10:00:00.000Z",
            user_metadata: {
              full_name: "Ada Lovelace",
              avatar_url: "https://example.com/avatar.png",
            },
            app_metadata: {
              provider: "google",
            },
          },
        },
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        listings: [{ id: "listing-1" }, { id: "listing-2" }],
      }),
    });

    render(<HookHarness activeNav="marketplace" />);

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("Ada");
    });

    await waitFor(() => {
      expect(screen.getByTestId("listings-count")).toHaveTextContent("2");
      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
    });

    expect(screen.getByTestId("user-email")).toHaveTextContent("ada@uni.edu");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/listings"),
      undefined,
    );
  });

  it("handles my-listings fetch errors when the access token is missing", async () => {
    supabase.auth.getSession
      .mockResolvedValueOnce({
        data: {
          session: {
            user: {
              id: "student-1",
              email: "grace@uni.edu",
              created_at: "2026-01-01T10:00:00.000Z",
              last_sign_in_at: "2026-05-10T10:00:00.000Z",
              user_metadata: {},
              app_metadata: {},
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: "",
          },
        },
      });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<HookHarness activeNav="my-listings" />);

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("grace");
    });

    await waitFor(() => {
      expect(screen.getByTestId("listings-count")).toHaveTextContent("0");
      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle");
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
