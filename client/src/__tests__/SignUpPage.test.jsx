import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import SignUpPage from "../pages/SignUpPage";

jest.mock("../components/SignUp", () => () => <section>Mock sign up</section>);

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sign-up component", () => {
    render(<SignUpPage />);

    expect(screen.getByText(/mock sign up/i)).toBeInTheDocument();
  });
});
