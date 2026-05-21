import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import NavBar from "../components/NavBar";

describe("NavBar", () => {
  it("renders the marketing navigation links", () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: /main navigation/i,
    });

    expect(
      within(navigation).getByRole("link", { name: /unisquare home/i }),
    ).toHaveAttribute("href", "/");
    expect(
      within(navigation).getByRole("link", { name: /^home$/i }),
    ).toHaveAttribute("href", "/");
    expect(
      within(navigation).getByRole("link", { name: /about/i }),
    ).toHaveAttribute("href", "/about");
    expect(
      within(navigation).getByRole("link", { name: /sign in/i }),
    ).toHaveAttribute("href", "/signin");
    expect(
      within(navigation).getByRole("link", { name: /get started/i }),
    ).toHaveAttribute("href", "/signup");
  });

  it("marks the current marketing page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <NavBar />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: /main navigation/i,
    });

    expect(
      within(navigation).getByRole("link", { name: /about/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByRole("link", { name: /^home$/i }),
    ).not.toHaveAttribute("aria-current");
  });
});
