import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorPalette } from "../src/components/ColorPalette.js";

describe("ColorPalette", () => {
  describe("rendering", () => {
    it("should render with current color", () => {
      render(<ColorPalette value="#ff0000" onChange={vi.fn()} />);

      expect(screen.getByText("#FF0000")).toBeInTheDocument();
    });

    it("should show transparent option when allowTransparent is true", async () => {
      const user = userEvent.setup();
      render(<ColorPalette value="transparent" onChange={vi.fn()} allowTransparent={true} />);

      expect(screen.getByText("Transparent")).toBeInTheDocument();

      // Click to open palette
      await user.click(screen.getByText("Transparent"));
      expect(screen.getByText("∅ Transparent")).toBeInTheDocument();
    });

    it("should render label when provided", () => {
      render(<ColorPalette value="#000000" onChange={vi.fn()} label="Test Color" />);

      expect(screen.getByText("Test Color:")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onChange when preset color is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<ColorPalette value="#000000" onChange={mockOnChange} />);

      // Open palette
      await user.click(screen.getByText("#000000"));

      // Click on a preset color (first white color)
      const colorButtons = screen.getAllByRole("button");
      const whiteButton = colorButtons.find((button) => button.getAttribute("title") === "#ffffff");

      if (whiteButton) {
        await user.click(whiteButton);
        expect(mockOnChange).toHaveBeenCalledWith("#ffffff");
      }
    });

    it("should call onChange when transparent is selected", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<ColorPalette value="#000000" onChange={mockOnChange} allowTransparent={true} />);

      // Open palette
      await user.click(screen.getByText("#000000"));

      // Click transparent option
      await user.click(screen.getByText("∅ Transparent"));

      expect(mockOnChange).toHaveBeenCalledWith("transparent");
    });

    it("should show custom color picker", async () => {
      const user = userEvent.setup();

      render(<ColorPalette value="#000000" onChange={vi.fn()} />);

      // Open palette
      await user.click(screen.getByText("#000000"));

      // Custom color picker should be visible
      expect(screen.getByText("Custom:")).toBeInTheDocument();
      expect(screen.getByDisplayValue("#000000")).toBeInTheDocument();
    });
  });
});
