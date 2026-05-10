import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../config/supabaseClient";
import useListingDetails from "../../hooks/useListingDetails";

function HookHarness({ listingId = "listing-1", onDeleteSuccess = jest.fn() }) {
  const {
    listing,
    error,
    imageUrl,
    isOwner,
    isLoggedInBuyer,
    deleting,
    editing,
    saving,
    saveError,
    editForm,
    handleDelete,
    handleEditChange,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  } = useListingDetails({ listingId, onDeleteSuccess });

  return (
    <section>
      <p data-testid="listing-title">{listing?.title || ""}</p>
      <p data-testid="error-message">{error || ""}</p>
      <p data-testid="image-url">{imageUrl || ""}</p>
      <p data-testid="is-owner">{isOwner ? "yes" : "no"}</p>
      <p data-testid="is-buyer">{isLoggedInBuyer ? "yes" : "no"}</p>
      <p data-testid="deleting">{deleting ? "yes" : "no"}</p>
      <p data-testid="editing">{editing ? "yes" : "no"}</p>
      <p data-testid="saving">{saving ? "yes" : "no"}</p>
      <p data-testid="save-error">{saveError}</p>

      <label htmlFor="edit-title">Title</label>
      <input
        id="edit-title"
        name="title"
        value={editForm.title}
        onChange={handleEditChange}
      />

      <label htmlFor="edit-price">Asking Price</label>
      <input
        id="edit-price"
        name="askingPrice"
        value={editForm.askingPrice}
        onChange={handleEditChange}
      />

      <button type="button" onClick={handleDelete}>
        Delete listing
      </button>
      <button type="button" onClick={handleStartEdit}>
        Start edit
      </button>
      <button type="button" onClick={handleCancelEdit}>
        Cancel edit
      </button>

      <form onSubmit={handleSaveEdit}>
        <button type="submit">Save listing</button>
      </form>
    </section>
  );
}

const listingResponse = {
  listing: {
    id: "listing-1",
    title: "Canon EOS R6",
    description: "Mirrorless camera body",
    price: 18500,
    category: "Electronics",
    condition: "like_new",
    listing_type: "sale",
    seller: {
      id: "seller-1",
    },
    listing_images: [{ storage_path: "canon-r6.jpg" }],
  },
};

const updatedListingResponse = {
  listing: {
    ...listingResponse.listing,
    title: "Canon EOS R6 Mark II",
    price: 19000,
  },
};

describe("useListingDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VITE_SUPABASE_URL = "https://supabase.test";
    global.fetch = jest.fn();
  });

  it("loads the listing, image URL, and owner state", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => listingResponse,
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("listing-title")).toHaveTextContent(
        "Canon EOS R6",
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue("Canon EOS R6");
    });

    expect(screen.getByLabelText(/asking price/i)).toHaveValue("18500");
    expect(screen.getByTestId("image-url")).toHaveTextContent(
      "https://supabase.test/storage/v1/object/public/listing-images/canon-r6.jpg",
    );
    expect(screen.getByTestId("is-owner")).toHaveTextContent("yes");
    expect(screen.getByTestId("is-buyer")).toHaveTextContent("no");
  });

  it("treats non-owners as logged-in buyers", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "buyer-1",
          },
        },
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => listingResponse,
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("is-owner")).toHaveTextContent("no");
      expect(screen.getByTestId("is-buyer")).toHaveTextContent("yes");
    });
  });

  it("surfaces fetch errors when the listing request fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "buyer-1",
          },
        },
      },
    });

    global.fetch.mockResolvedValue({
      ok: false,
      text: async () => "DB error",
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Failed to fetch listing",
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("deletes the listing and notifies the page on success", async () => {
    const user = userEvent.setup();
    const onDeleteSuccess = jest.fn();

    jest.spyOn(window, "confirm").mockReturnValue(true);

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => listingResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<HookHarness onDeleteSuccess={onDeleteSuccess} />);

    await waitFor(() => {
      expect(screen.getByTestId("listing-title")).toHaveTextContent(
        "Canon EOS R6",
      );
    });

    await user.click(screen.getByRole("button", { name: /delete listing/i }));

    await waitFor(() => {
      expect(onDeleteSuccess).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/listings/listing-1"),
      { method: "DELETE" },
    );

    window.confirm.mockRestore();
  });

  it("alerts the user when deleting the listing fails", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.spyOn(window, "alert").mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => listingResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("listing-title")).toHaveTextContent(
        "Canon EOS R6",
      );
    });

    await user.click(screen.getByRole("button", { name: /delete listing/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Something went wrong while deleting. Please try again.",
      );
      expect(screen.getByTestId("deleting")).toHaveTextContent("no");
    });

    consoleErrorSpy.mockRestore();
    window.confirm.mockRestore();
    window.alert.mockRestore();
  });

  it("starts editing, tracks field changes, and restores the original form on cancel", async () => {
    const user = userEvent.setup();

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => listingResponse,
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue("Canon EOS R6");
    });

    await user.click(screen.getByRole("button", { name: /start edit/i }));
    expect(screen.getByTestId("editing")).toHaveTextContent("yes");

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Updated camera");
    expect(screen.getByLabelText(/title/i)).toHaveValue("Updated camera");

    await user.click(screen.getByRole("button", { name: /cancel edit/i }));

    expect(screen.getByTestId("editing")).toHaveTextContent("no");
    expect(screen.getByLabelText(/title/i)).toHaveValue("Canon EOS R6");
  });

  it("validates the asking price before sending an update", async () => {
    const user = userEvent.setup();

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => listingResponse,
    });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByLabelText(/asking price/i)).toHaveValue("18500");
    });

    await user.click(screen.getByRole("button", { name: /start edit/i }));
    await user.clear(screen.getByLabelText(/asking price/i));
    await user.type(screen.getByLabelText(/asking price/i), "0");
    await user.click(screen.getByRole("button", { name: /save listing/i }));

    expect(screen.getByTestId("save-error")).toHaveTextContent(
      "Price must be a positive number.",
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("saves listing edits and refreshes the listing data", async () => {
    const user = userEvent.setup();

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => listingResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedListingResponse,
      });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue("Canon EOS R6");
    });

    await user.click(screen.getByRole("button", { name: /start edit/i }));
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Canon EOS R6 Mark II");
    await user.clear(screen.getByLabelText(/asking price/i));
    await user.type(screen.getByLabelText(/asking price/i), "19000");
    await user.click(screen.getByRole("button", { name: /save listing/i }));

    await waitFor(() => {
      expect(screen.getByTestId("listing-title")).toHaveTextContent(
        "Canon EOS R6 Mark II",
      );
      expect(screen.getByTestId("editing")).toHaveTextContent("no");
      expect(screen.getByTestId("saving")).toHaveTextContent("no");
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/listings/listing-1"),
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Canon EOS R6 Mark II",
          description: "Mirrorless camera body",
          askingPrice: 19000,
          category: "Electronics",
          condition: "like_new",
          listingType: "sale",
        }),
      }),
    );
  });

  it("shows API update errors without leaving edit mode", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "seller-1",
          },
        },
      },
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => listingResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Update failed" }),
      });

    render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue("Canon EOS R6");
    });

    await user.click(screen.getByRole("button", { name: /start edit/i }));
    await user.click(screen.getByRole("button", { name: /save listing/i }));

    await waitFor(() => {
      expect(screen.getByTestId("save-error")).toHaveTextContent(
        "Update failed",
      );
      expect(screen.getByTestId("editing")).toHaveTextContent("yes");
      expect(screen.getByTestId("saving")).toHaveTextContent("no");
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
