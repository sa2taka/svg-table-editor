import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "../../src/components/Toolbar.js";

describe("SVG Export in Toolbar", () => {
  beforeEach(() => {
    // Mock window.alert
    vi.spyOn(window, "alert").mockImplementation(() => {});

    // Mock URL.createObjectURL and related DOM APIs
    Object.defineProperty(window, "URL", {
      value: {
        createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
        revokeObjectURL: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render SVG export button", () => {
    const mockOnExportSVG = vi.fn();

    render(<Toolbar onExportSVG={mockOnExportSVG} tableSize={{ rows: 3, columns: 4 }} />);

    expect(screen.getByText("📥 Export")).toBeInTheDocument();
  });

  it("should have correct button styling", () => {
    const mockOnExportSVG = vi.fn();

    render(<Toolbar onExportSVG={mockOnExportSVG} tableSize={{ rows: 3, columns: 4 }} />);

    const exportButton = screen.getByText("📥 Export");
    expect(exportButton).toHaveStyle({
      backgroundColor: "#28a745",
      color: "#fff",
      fontWeight: "bold",
    });
  });

  it("should call onExportSVG when clicked", async () => {
    const user = userEvent.setup();
    const mockOnExportSVG = vi.fn();

    render(<Toolbar onExportSVG={mockOnExportSVG} tableSize={{ rows: 3, columns: 4 }} />);

    const exportButton = screen.getByText("📥 Export");
    await user.click(exportButton);

    expect(mockOnExportSVG).toHaveBeenCalledTimes(1);
  });

  it("should show tooltip", () => {
    const mockOnExportSVG = vi.fn();

    render(<Toolbar onExportSVG={mockOnExportSVG} tableSize={{ rows: 3, columns: 4 }} />);

    const exportButton = screen.getByText("📥 Export");
    expect(exportButton).toHaveAttribute("title", "Export responsive SVG (auto-sized cells)");
  });
});
