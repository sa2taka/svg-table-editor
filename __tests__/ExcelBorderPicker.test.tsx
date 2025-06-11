import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExcelBorderPicker } from "../src/components/ExcelBorderPicker.js";
import { GridBorderStyle } from "../src/models/TableDataModel.js";

describe("ExcelBorderPicker", () => {
  const mockGridBorderStyle: GridBorderStyle = {
    outer: {
      top: "#000000",
      right: "#000000",
      bottom: "#000000",
      left: "#000000",
    },
    innerVertical: "#000000",
    innerHorizontal: "#000000",
  };

  describe("rendering", () => {
    it("should render Excel border picker button", () => {
      render(<ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} />);

      expect(screen.getByText("Excel Borders")).toBeInTheDocument();
    });

    it("should show border preview", () => {
      render(<ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        display: "flex",
        alignItems: "center",
      });
    });

    it("should render with custom label", () => {
      render(<ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} label="Custom Border" />);

      expect(screen.getByText("Custom Border:")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should open picker when clicking button", async () => {
      const user = userEvent.setup();
      render(<ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} />);

      await user.click(screen.getByText("Excel Borders"));

      expect(screen.getByText("Border Type")).toBeInTheDocument();
      expect(screen.getByText("📋 Outer Borders (周りの枠線)")).toBeInTheDocument();
      expect(screen.getByText("| Inner Vertical Lines (中の縦線)")).toBeInTheDocument();
      expect(screen.getByText("≡ Inner Horizontal Lines (中の横線)")).toBeInTheDocument();
    });

    it("should close picker when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Open picker
      await user.click(screen.getByText("Excel Borders"));
      expect(screen.getByText("Border Type")).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId("outside-element"));

      // Picker should be closed
      expect(screen.queryByText("Border Type")).not.toBeInTheDocument();
    });

    it("should switch between border options", async () => {
      const user = userEvent.setup();
      render(<ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} />);

      await user.click(screen.getByText("Excel Borders"));

      // Default is outer borders
      expect(screen.getByText("Outer Border Sides")).toBeInTheDocument();

      // Switch to inner vertical
      await user.click(screen.getByText("| Inner Vertical Lines (中の縦線)"));
      expect(screen.getByText("Inner Vertical Lines Color:")).toBeInTheDocument();

      // Switch to inner horizontal
      await user.click(screen.getByText("≡ Inner Horizontal Lines (中の横線)"));
      expect(screen.getByText("Inner Horizontal Lines Color:")).toBeInTheDocument();
    });

    it("should close picker when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<ExcelBorderPicker value={mockGridBorderStyle} onChange={vi.fn()} />);

      await user.click(screen.getByText("Excel Borders"));
      expect(screen.getByText("Border Type")).toBeInTheDocument();

      await user.click(screen.getByText("Close"));
      expect(screen.queryByText("Border Type")).not.toBeInTheDocument();
    });
  });

  describe("border style values", () => {
    it("should handle transparent borders", () => {
      const transparentGridStyle: GridBorderStyle = {
        outer: {
          top: "transparent",
          right: "transparent",
          bottom: "transparent",
          left: "transparent",
        },
        innerVertical: "transparent",
        innerHorizontal: "transparent",
      };

      render(<ExcelBorderPicker value={transparentGridStyle} onChange={vi.fn()} />);

      expect(screen.getByText("Excel Borders")).toBeInTheDocument();
    });

    it("should handle mixed border colors", () => {
      const mixedGridStyle: GridBorderStyle = {
        outer: {
          top: "#ff0000",
          right: "#00ff00",
          bottom: "#0000ff",
          left: "#ffff00",
        },
        innerVertical: "#ff00ff",
        innerHorizontal: "#00ffff",
      };

      render(<ExcelBorderPicker value={mixedGridStyle} onChange={vi.fn()} />);

      expect(screen.getByText("Excel Borders")).toBeInTheDocument();
    });
  });
});
