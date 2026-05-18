import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, jest } from "@jest/globals";
import FacilitySettingsPanel from "../../components/adminDashboard/FacilitySettingsPanel";

describe("FacilitySettingsPanel", () => {
  it("updates settings and saves changes", async () => {
    const user = userEvent.setup();
    const handleSettingChange = jest.fn();
    const handleHoursChange = jest.fn();
    const handleSave = jest.fn();

    render(
      <FacilitySettingsPanel
        settings={{
          name: "University Square",
          location: "Main Campus",
          slotCapacity: 6,
          isActive: true,
        }}
        operatingHours={[
          { day: "Mon", open: "08:00", close: "18:00", active: true },
        ]}
        onSettingChange={handleSettingChange}
        onHoursChange={handleHoursChange}
        onSave={handleSave}
        lastSavedAt={new Date("2025-01-01T10:00:00Z")}
      />,
    );

    const nameInput = screen.getByLabelText("Facility Name");
    fireEvent.change(nameInput, { target: { value: "New Facility" } });

    expect(handleSettingChange).toHaveBeenCalledWith("name", "New Facility");

    const slotInput = screen.getByLabelText("Slot Capacity");
    fireEvent.change(slotInput, { target: { value: "8" } });

    expect(handleSettingChange).toHaveBeenCalledWith("slotCapacity", 8);

    const openInput = screen.getByDisplayValue("08:00");
    fireEvent.change(openInput, { target: { value: "09:00" } });

    expect(handleHoursChange).toHaveBeenCalledWith("Mon", "open", "09:00");

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/last saved/i)).toBeInTheDocument();
  });

  it("renders new and saving states with inactive hours", () => {
    const handleSettingChange = jest.fn();
    const handleHoursChange = jest.fn();
    const handleSave = jest.fn();

    const { rerender } = render(
      <FacilitySettingsPanel
        settings={{
          name: "Quiet Room",
          location: "Library",
          slotCapacity: 4,
          isActive: false,
        }}
        operatingHours={[
          { day: "Sat", open: "", close: "", active: false },
        ]}
        onSettingChange={handleSettingChange}
        onHoursChange={handleHoursChange}
        onSave={handleSave}
        isNew
      />,
    );

    expect(
      screen.getByText(/configure a new trade facility/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create facility/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Facility Active")).not.toBeChecked();
    expect(screen.getAllByDisplayValue("")[0]).toBeDisabled();

    rerender(
      <FacilitySettingsPanel
        settings={{
          name: "Quiet Room",
          location: "Library",
          slotCapacity: 4,
          isActive: false,
        }}
        operatingHours={[
          { day: "Sat", open: "", close: "", active: false },
        ]}
        onSettingChange={handleSettingChange}
        onHoursChange={handleHoursChange}
        onSave={handleSave}
        isSaving
      />,
    );

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });
});
