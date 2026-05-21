import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, jest } from "@jest/globals";
import Navbar from "../../components/studentDashboard/Navbar";

describe("Navbar", () => {
  it("renders the brand, user name, and avatar", () => {
    const user = {
      fullName: "Ada Lovelace",
      avatarUrl: "https://example.test/avatar.png",
    };

    render(<Navbar user={user} searchValue="" onSearch={jest.fn()} />);

    expect(screen.getByRole("link", { name: /unisquare/i })).toHaveAttribute(
      "href",
      "/student-dashboard",
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByAltText("Ada Lovelace avatar")).toHaveAttribute(
      "src",
      "https://example.test/avatar.png",
    );
    expect(screen.getByLabelText(/view notifications/i)).toBeInTheDocument();
  });

  it("calls onSearch when the search input changes", () => {
    const handleSearch = jest.fn();

    render(<Navbar user={{}} searchValue="" onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "textbook" } });

    expect(handleSearch).toHaveBeenCalledWith("textbook");
  });

  it("renders fallbacks, notification badge, and optional search handling", () => {
    render(<Navbar user={{ name: "Grace" }} notificationCount={3} />);

    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/3 unread notifications/i),
    ).toHaveAttribute("href", "/notifications");
    expect(
      screen.getByText("Grace profile picture"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "lamp" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(screen.queryByAltText(/avatar/i)).not.toBeInTheDocument();
  });
});
