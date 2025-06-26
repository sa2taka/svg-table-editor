import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BordersPicker } from "../src/components/BordersPicker.js";

describe("BordersPicker", () => {
  const mockOnCellBorderChange = vi.fn();
  const mockOnGridBorderChange = vi.fn();

  const defaultCellBorder = {
    top: "#000000",
    right: "#000000",
    bottom: "#000000",
    left: "#000000",
  };

  const defaultGridBorder = {
    outer: {
      top: "#000000",
      right: "#000000",
      bottom: "#000000",
      left: "#000000",
    },
    innerVertical: "#000000",
    innerHorizontal: "#000000",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render borders picker button", () => {
    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
        label="Test Borders"
      />
    );

    expect(screen.getByText("Test Borders:")).toBeInTheDocument();
    expect(screen.getByText("Borders")).toBeInTheDocument();
  });

  it("should open dropdown when button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    expect(screen.getByText("Individual Cell")).toBeInTheDocument();
    expect(screen.getByText("Selection Range")).toBeInTheDocument();
    expect(screen.getByText("Quick Presets:")).toBeInTheDocument();
  });

  it("should display preset buttons", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    expect(screen.getByText("🚫 No Borders")).toBeInTheDocument();
    expect(screen.getByText("⬜ All Borders")).toBeInTheDocument();
    expect(screen.getByText("🔲 Outer Only")).toBeInTheDocument();
    expect(screen.getByText("⊞ Grid Lines")).toBeInTheDocument();
  });

  it("should apply 'no borders' preset", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    const noBordersButton = screen.getByText("🚫 No Borders");
    await user.click(noBordersButton);

    expect(mockOnCellBorderChange).toHaveBeenCalledWith({
      top: "transparent",
      right: "transparent",
      bottom: "transparent",
      left: "transparent",
    });
  });

  it("should apply 'all borders' preset", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    const allBordersButton = screen.getByText("⬜ All Borders");
    await user.click(allBordersButton);

    expect(mockOnCellBorderChange).toHaveBeenCalledWith({
      top: "#000000",
      right: "#000000",
      bottom: "#000000",
      left: "#000000",
    });
  });

  it("should switch between individual cell and selection range modes", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    // デフォルトは Individual Cell モード
    expect(screen.getByText("Edit individual cell borders:")).toBeInTheDocument();

    // Selection Range モードに切り替え
    const rangeTab = screen.getByText("Selection Range");
    await user.click(rangeTab);

    expect(screen.getByText("Edit selection range borders:")).toBeInTheDocument();
    expect(screen.getByText("Outer Border")).toBeInTheDocument();
    expect(screen.getByText("Vertical Lines")).toBeInTheDocument();
    expect(screen.getByText("Horizontal Lines")).toBeInTheDocument();
  });

  it("should handle individual cell border side selection", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    // Individual Cell モードで Right を選択
    const rightButton = screen.getByText("Right");
    await user.click(rightButton);

    // Right ボタンがアクティブになることを確認
    expect(rightButton).toHaveStyle({ backgroundColor: "#007bff" });
  });

  it("should handle grid border type selection", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    // Selection Range モードに切り替え
    const rangeTab = screen.getByText("Selection Range");
    await user.click(rangeTab);

    // Vertical Lines を選択
    const verticalButton = screen.getByText("Vertical Lines");
    await user.click(verticalButton);

    expect(verticalButton).toHaveStyle({ backgroundColor: "#007bff" });
  });

  it("should close picker when close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    expect(screen.getByText("Quick Presets:")).toBeInTheDocument();

    const closeButton = screen.getByText("Close");
    await user.click(closeButton);

    expect(screen.queryByText("Quick Presets:")).not.toBeInTheDocument();
  });

  it("should close picker when clicking outside", async () => {
    render(
      <div>
        <BordersPicker
          cellBorder={defaultCellBorder}
          onCellBorderChange={mockOnCellBorderChange}
          gridBorder={defaultGridBorder}
          onGridBorderChange={mockOnGridBorderChange}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByText("Borders");
    const user = userEvent.setup();
    await user.click(button);

    expect(screen.getByText("Quick Presets:")).toBeInTheDocument();

    // 外側をクリック
    const outsideElement = screen.getByTestId("outside");
    fireEvent.mouseDown(outsideElement);

    expect(screen.queryByText("Quick Presets:")).not.toBeInTheDocument();
  });

  it("should apply outer border preset", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    const outerButton = screen.getByText("🔲 Outer Only");
    await user.click(outerButton);

    expect(mockOnGridBorderChange).toHaveBeenCalledWith({
      ...defaultGridBorder,
      outer: {
        top: "#000000",
        right: "#000000",
        bottom: "#000000",
        left: "#000000",
      },
    });
  });

  it("should apply grid lines preset", async () => {
    const user = userEvent.setup();

    render(
      <BordersPicker
        cellBorder={defaultCellBorder}
        onCellBorderChange={mockOnCellBorderChange}
        gridBorder={defaultGridBorder}
        onGridBorderChange={mockOnGridBorderChange}
      />
    );

    const button = screen.getByText("Borders");
    await user.click(button);

    const gridButton = screen.getByText("⊞ Grid Lines");
    await user.click(gridButton);

    expect(mockOnGridBorderChange).toHaveBeenCalledWith({
      outer: defaultGridBorder.outer,
      innerVertical: "#000000",
      innerHorizontal: "#000000",
    });
  });
});
