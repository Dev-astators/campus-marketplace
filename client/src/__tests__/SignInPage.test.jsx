import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import SignInPage from "../pages/SignInPage";

jest.mock("../components/SignIn.jsx", () => () => <section>Mock sign in</section>);

describe("SignInPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sign-in component", () => {
    render(<SignInPage />);

    expect(screen.getByText(/mock sign in/i)).toBeInTheDocument();
  });
});
