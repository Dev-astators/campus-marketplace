import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import WelcomePage from "../../pages/WelcomePage";

describe("WelcomePage", () => {
  it("renders the landing sections", () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        (_, node) => node?.textContent?.replace(/\s+/g, "") === "UniSquare",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/discover, buy, sell/i)).toBeInTheDocument();
    expect(screen.getByText(/curated categories/i)).toBeInTheDocument();
  });
});
