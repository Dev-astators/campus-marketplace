/**
 * @jest-environment node
 */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { redirectTo } from "../../utils/navigation";

describe("redirectTo", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
      writable: true,
    });
  });

  it("assigns the requested location when a browser window exists", () => {
    const assign = jest.fn();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { assign },
      },
      writable: true,
    });

    redirectTo("/signin");

    expect(assign).toHaveBeenCalledWith("/signin");
  });

  it("does nothing outside the browser", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
      writable: true,
    });

    expect(() => redirectTo("/signin")).not.toThrow();
  });
});
