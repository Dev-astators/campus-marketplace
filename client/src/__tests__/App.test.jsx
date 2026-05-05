// src/__tests__/App.test.jsx
// A smoke test to verify Jest + React Testing Library are wired up correctly.
// Replace this with tests for your actual components.
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { describe, it, expect } from "@jest/globals";
import App from "../App";

describe("App routing", () => {
  it("renders without crashing", () => {
    render(<App />);
    // Check that at least one element is present in the document
    expect(document.body).toBeInTheDocument();
  });
});
