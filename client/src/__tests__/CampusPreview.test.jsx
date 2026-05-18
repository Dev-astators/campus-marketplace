import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "@jest/globals";
import CampusPreview from "../pages/CampusPreview";

describe("CampusPreview", () => {
  it("renders the hero content and category cards", () => {
    render(
      <MemoryRouter>
        <CampusPreview />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: /discover, buy, sell & connect/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sign in/i }),
    ).toHaveAttribute("href", "/signin");
    expect(
      screen.getByRole("link", { name: /get started/i }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("heading", { name: /academic textbooks/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /home & kitchen/i }),
    ).toBeInTheDocument();
  });
});
