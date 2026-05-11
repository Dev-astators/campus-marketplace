import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, jest } from "@jest/globals";
import UserManagement from "../../components/adminDashboard/UserManagement";

describe("UserManagement", () => {
  it("filters users and confirms a role change", async () => {
    const user = userEvent.setup();
    const onRoleChange = jest.fn();

    const users = [
      {
        id: "user-1",
        full_name: "Ada Lovelace",
        email: "ada@example.com",
        university: "Wits",
        student_number: "S123",
        total_ratings: 2,
        average_rating: 4.5,
        created_at: "2026-05-10T10:00:00.000Z",
        role: "student",
      },
      {
        id: "user-2",
        full_name: "Grace Hopper",
        email: "grace@example.com",
        university: "Wits",
        student_number: "S456",
        total_ratings: 0,
        average_rating: 0,
        created_at: "2026-05-09T10:00:00.000Z",
        role: "admin",
      },
    ];

    render(
      <UserManagement
        users={users}
        togglingRole={null}
        onRoleChange={onRoleChange}
      />,
    );

    await user.type(screen.getByPlaceholderText(/search by name/i), "Ada");

    expect(screen.getByText("1 / 2 users")).toBeInTheDocument();

    const roleSelect = screen.getByLabelText(/change role for ada/i);
    await user.selectOptions(roleSelect, "admin");

    expect(
      screen.getByRole("dialog", { name: /confirm role change/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onRoleChange).toHaveBeenCalledWith("user-1", "admin");
  });
});
