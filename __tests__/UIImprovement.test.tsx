import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BorderColorPicker } from "../src/components/BorderColorPicker.js";
import { ColorPalette } from "../src/components/ColorPalette.js";

describe("UI Improvements", () => {
  describe("ColorPalette - Click outside to close", () => {
    it("should close palette when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ColorPalette value="#000000" onChange={vi.fn()} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Open palette
      await user.click(screen.getByText("#000000"));
      expect(screen.getByText("Custom:")).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId("outside-element"));

      // Palette should be closed
      expect(screen.queryByText("Custom:")).not.toBeInTheDocument();
    });

    it("should support transparent option for border colors", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<ColorPalette value="transparent" onChange={mockOnChange} allowTransparent={true} />);

      expect(screen.getByText("Transparent")).toBeInTheDocument();

      // Click to open palette
      await user.click(screen.getByText("Transparent"));
      expect(screen.getByText("∅ Transparent")).toBeInTheDocument();
    });
  });

  describe("BorderColorPicker - Click outside to close", () => {
    it("should close picker when clicking outside", async () => {
      const user = userEvent.setup();
      const mockBorderColor = {
        top: "#000000",
        right: "#000000",
        bottom: "#000000",
        left: "#000000",
      };

      render(
        <div>
          <BorderColorPicker value={mockBorderColor} onChange={vi.fn()} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Open picker
      await user.click(screen.getByText("Border Colors"));
      expect(screen.getByText("Select Border Side")).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId("outside-element"));

      // Picker should be closed
      expect(screen.queryByText("Select Border Side")).not.toBeInTheDocument();
    });

    it("should support transparent borders", () => {
      const mockBorderColor = {
        top: "transparent",
        right: "#ff0000",
        bottom: "transparent",
        left: "#00ff00",
      };

      render(<BorderColorPicker value={mockBorderColor} onChange={vi.fn()} />);

      // Should render without error with mixed transparent/color borders
      expect(screen.getByText("Border Colors")).toBeInTheDocument();
    });
  });
});
