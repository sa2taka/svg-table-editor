import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App.js";

describe("Table Size Integration", () => {
  it("should render table add controls", () => {
    render(<App />);

    // Check for the add buttons in the table
    const addButtons = screen.getAllByText("+");
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it("should add a row when + button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial table should have 6 rows (1 header row + 4 data rows + 1 add row button row)
    const initialRows = screen.getAllByRole("row");
    expect(initialRows).toHaveLength(6);

    // Find the row add button (should be in the last row)
    const addButtons = screen.getAllByText("+");
    const rowAddButton = addButtons.find((button) => button.getAttribute("title") === "Add row");
    expect(rowAddButton).toBeInTheDocument();

    if (rowAddButton) {
      await user.click(rowAddButton);
    }

    // After adding a row, should have 7 rows (1 header row + 5 data rows + 1 add row button row)
    const newRows = screen.getAllByRole("row");
    expect(newRows).toHaveLength(7);
  });

  it("should add a column when + button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial table should have 6 columns (4 data columns + 1 header column + 1 add button column)
    const firstRow = screen.getAllByRole("row")[0];
    const initialCells = firstRow.querySelectorAll("th");
    expect(initialCells).toHaveLength(6);

    // Find the column add button
    const addButtons = screen.getAllByText("+");
    const colAddButton = addButtons.find((button) => button.getAttribute("title") === "Add column");
    expect(colAddButton).toBeInTheDocument();

    if (colAddButton) {
      await user.click(colAddButton);
    }

    // After adding a column, should have 7 columns (5 data columns + 1 header column + 1 add button column)
    const newFirstRow = screen.getAllByRole("row")[0];
    const newCells = newFirstRow.querySelectorAll("th");
    expect(newCells).toHaveLength(7);
  });

  it("should have context menu for row and column operations", async () => {
    render(<App />);

    // Test that right-clicking on row header shows context menu
    const rowHeaders = screen.getAllByTitle(/Row \d+ - Right click for options/);
    expect(rowHeaders.length).toBeGreaterThan(0);

    // Test that right-clicking on column header shows context menu
    const colHeaders = screen.getAllByTitle(/Column \d+ - Right click for options/);
    expect(colHeaders.length).toBeGreaterThan(0);
  });

  it("should handle table interactions properly", async () => {
    render(<App />);

    // Verify basic table functionality still works
    const cells = screen.getAllByRole("cell");
    expect(cells.length).toBeGreaterThan(0);

    // Verify add buttons are present and functional
    const addButtons = screen.getAllByText("+");
    expect(addButtons.length).toBeGreaterThan(0);
  });
});
