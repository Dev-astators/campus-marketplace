import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import AboutPage from "../../pages/AboutPage";

function renderAboutPage() {
  render(
    <MemoryRouter initialEntries={["/about"]}>
      <AboutPage />
    </MemoryRouter>,
  );
}

describe("AboutPage", () => {
  it("describes the app, exchange flow, developers, and marketplace examples", () => {
    renderAboutPage();

    expect(
      screen.getByRole("heading", {
        name: /a safer campus marketplace built for everyday student trade/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("img", { name: /wits great hall and campus lawns/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/verified wits students/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /unisquare turns informal student trading/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /every handoff has a clearer trail/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /built by dev-astators/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("img", { name: /textbooks listed for student resale/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /admin and facility tools/i }),
    ).toBeInTheDocument();
  });

  it("exposes section links and marks About as the active public nav link", () => {
    renderAboutPage();

    const mainNavigation = screen.getByRole("navigation", {
      name: /main navigation/i,
    });
    const aboutLink = within(mainNavigation).getByRole("link", {
      name: /about/i,
    });

    expect(aboutLink).toHaveAttribute("aria-current", "page");
    expect(
      within(mainNavigation).getByRole("link", { name: /^home$/i }),
    ).not.toHaveAttribute("aria-current");

    const aboutPageNavigation = screen.getByRole("navigation", {
      name: /about page sections/i,
    });

    expect(
      within(aboutPageNavigation).getByRole("link", { name: /what we do/i }),
    ).toHaveAttribute("href", "#what-we-do");
    expect(
      within(aboutPageNavigation).getByRole("link", { name: /handoff flow/i }),
    ).toHaveAttribute("href", "#handoff-flow");
    expect(
      within(aboutPageNavigation).getByRole("link", { name: /developers/i }),
    ).toHaveAttribute("href", "#developers");
  });
});
