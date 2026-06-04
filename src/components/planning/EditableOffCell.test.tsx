import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { EditableOffCell } from "./EditableOffCell";

const { refreshMock, setResourceTimeOffMock, deleteResourceTimeOffMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  setResourceTimeOffMock: vi.fn(),
  deleteResourceTimeOffMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/planning/actions", () => ({
  setResourceTimeOff: setResourceTimeOffMock,
  deleteResourceTimeOff: deleteResourceTimeOffMock,
}));

type ResourceTimeOffCellData = {
  id: string;
  resourceId: string;
  weekStart: string;
  offPct: number;
};

const defaultProps = {
  rowId: "off:r1",
  resourceId: "r1",
  weekStart: "2026-04-06",
  isEditing: false,
  onEditingCellChange: vi.fn(),
  onTabNavigate: vi.fn(),
};

function renderOffCell(overrides: Partial<ComponentProps<typeof EditableOffCell>> = {}) {
  return render(
    <EditableOffCell
      {...defaultProps}
      timeOff={null}
      {...overrides}
    />,
  );
}

function makeTimeOff(overrides: Partial<ResourceTimeOffCellData> = {}): ResourceTimeOffCellData {
  return {
    id: "off-1",
    resourceId: "r1",
    weekStart: "2026-04-06",
    offPct: 40,
    ...overrides,
  };
}

describe("EditableOffCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setResourceTimeOffMock.mockResolvedValue({ ok: true, timeOffId: "off-1" });
    deleteResourceTimeOffMock.mockResolvedValue({ ok: true });
  });

  it('renders an existing OFF percentage as "40%" with an accessible edit button', () => {
    renderOffCell({ timeOff: makeTimeOff() });

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit off 40%/i })).toBeInTheDocument();
  });

  it("enters a percent and saves it through setResourceTimeOff", async () => {
    const user = userEvent.setup();
    renderOffCell({ isEditing: true });

    const input = screen.getByRole("textbox", { name: /off percent/i });
    await user.clear(input);
    await user.type(input, "25{Enter}");

    await waitFor(() => {
      expect(setResourceTimeOffMock).toHaveBeenCalledWith({
        resourceId: "r1",
        weekStart: "2026-04-06",
        offPct: 25,
      });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("clearing an existing OFF value deletes the time off row", async () => {
    const user = userEvent.setup();
    renderOffCell({ isEditing: true, timeOff: makeTimeOff() });

    const input = screen.getByRole("textbox", { name: /off percent/i });
    await user.clear(input);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(deleteResourceTimeOffMock).toHaveBeenCalledWith("off-1");
    });
    expect(setResourceTimeOffMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("entering 0 with no existing row requests removal for the resource/week", async () => {
    const user = userEvent.setup();
    renderOffCell({ isEditing: true, timeOff: null });

    const input = screen.getByRole("textbox", { name: /off percent/i });
    await user.clear(input);
    await user.type(input, "0{Enter}");

    await waitFor(() => {
      expect(setResourceTimeOffMock).toHaveBeenCalledWith({
        resourceId: "r1",
        weekStart: "2026-04-06",
        offPct: 0,
      });
    });
    expect(deleteResourceTimeOffMock).not.toHaveBeenCalled();
  });

  it('shows "Numbers only" for non-numeric input and does not call an action', async () => {
    const user = userEvent.setup();
    renderOffCell({ isEditing: true, timeOff: makeTimeOff() });

    const input = screen.getByRole("textbox", { name: /off percent/i });
    await user.clear(input);
    await user.type(input, "forty{Enter}");

    expect(await screen.findByText("Numbers only")).toBeInTheDocument();
    expect(setResourceTimeOffMock).not.toHaveBeenCalled();
    expect(deleteResourceTimeOffMock).not.toHaveBeenCalled();
  });
});
