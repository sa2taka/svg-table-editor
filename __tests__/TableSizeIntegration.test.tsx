import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App.js";

describe("Table Size Integration", () => {
  it("should render table size controls", () => {
    render(<App />);

    // Check for the actual button texts in the current UI
    expect(screen.getByText("+R")).toBeInTheDocument();
    expect(screen.getByText("-R")).toBeInTheDocument();
    expect(screen.getByText("+C")).toBeInTheDocument();
    expect(screen.getByText("-C")).toBeInTheDocument();
  });

  it("should add a row when + Row button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial table should have 5 rows (4 data rows + 1 header row)
    const initialRows = screen.getAllByRole("row");
    expect(initialRows).toHaveLength(5);

    await user.click(screen.getByText("+R"));

    // After adding a row, should have 6 rows (5 data rows + 1 header row)
    const newRows = screen.getAllByRole("row");
    expect(newRows).toHaveLength(6);
  });

  it("should add a column when + Col button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial table should have 5 columns (4 data columns + 1 header column)
    const firstRow = screen.getAllByRole("row")[0];
    const initialCells = firstRow.querySelectorAll("th");
    expect(initialCells).toHaveLength(5);

    await user.click(screen.getByText("+C"));

    // After adding a column, should have 6 columns (5 data columns + 1 header column)
    const newFirstRow = screen.getAllByRole("row")[0];
    const newCells = newFirstRow.querySelectorAll("th");
    expect(newCells).toHaveLength(6);
  });

  it("should remove a row when - Row button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial table should have 5 rows (4 data rows + 1 header row)
    const initialRows = screen.getAllByRole("row");
    expect(initialRows).toHaveLength(5);

    await user.click(screen.getByText("-R"));

    // After removing a row, should have 4 rows (3 data rows + 1 header row)
    const newRows = screen.getAllByRole("row");
    expect(newRows).toHaveLength(4);
  });

  it("should remove a column when - Col button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial table should have 5 columns (4 data columns + 1 header column)
    const firstRow = screen.getAllByRole("row")[0];
    const initialCells = firstRow.querySelectorAll("th");
    expect(initialCells).toHaveLength(5);

    await user.click(screen.getByText("-C"));

    // After removing a column, should have 4 columns (3 data columns + 1 header column)
    const newFirstRow = screen.getAllByRole("row")[0];
    const newCells = newFirstRow.querySelectorAll("th");
    expect(newCells).toHaveLength(4);
  });

  it("should disable - Row button when only one row remains", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Remove rows until only one remains
    await user.click(screen.getByText("-R"));
    await user.click(screen.getByText("-R"));
    await user.click(screen.getByText("-R"));

    // Should have 2 rows (1 data row + 1 header row)
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(2);

    const removeRowButton = screen.getByText("-R");
    expect(removeRowButton).toBeDisabled();
  });

  it("should disable - Col button when only one column remains", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Remove columns until only one remains
    await user.click(screen.getByText("-C"));
    await user.click(screen.getByText("-C"));
    await user.click(screen.getByText("-C"));

    // Should have 2 columns (1 data column + 1 header column)
    const firstRow = screen.getAllByRole("row")[0];
    const cells = firstRow.querySelectorAll("th");
    expect(cells).toHaveLength(2);

    const removeColButton = screen.getByText("-C");
    expect(removeColButton).toBeDisabled();
  });

  it("should handle adding and removing multiple rows/columns", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Add 2 rows and 2 columns
    await user.click(screen.getByText("+R"));
    await user.click(screen.getByText("+R"));
    await user.click(screen.getByText("+C"));
    await user.click(screen.getByText("+C"));

    // Should have 7 rows (6 data rows + 1 header row) and 7 columns (6 data columns + 1 header column)
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(7);
    const firstRow = rows[0];
    const columns = firstRow.querySelectorAll("th");
    expect(columns).toHaveLength(7);

    // Remove 1 row and 1 column
    await user.click(screen.getByText("-R"));
    await user.click(screen.getByText("-C"));

    // Should have 6 rows (5 data rows + 1 header row) and 6 columns (5 data columns + 1 header column)
    const newRows = screen.getAllByRole("row");
    expect(newRows).toHaveLength(6);
    const newFirstRow = newRows[0];
    const newColumns = newFirstRow.querySelectorAll("th");
    expect(newColumns).toHaveLength(6);
  });

  it("should update table display when size changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    const initialRows = screen.getAllByRole("row");
    expect(initialRows).toHaveLength(5); // 4 data rows + 1 header row

    // Add a row
    await user.click(screen.getByText("+R"));

    const newRows = screen.getAllByRole("row");
    expect(newRows).toHaveLength(6); // 5 data rows + 1 header row
  });
});
