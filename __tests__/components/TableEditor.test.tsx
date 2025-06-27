import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TableEditor } from "../../src/components/TableEditor.js";
import { createTable } from "../../src/models/TableDataModel.js";

describe("TableEditor", () => {
  describe("rendering", () => {
    it("should render table with correct structure", () => {
      const table = createTable(2, 3);
      render(<TableEditor table={table} />);

      const tableElement = screen.getByRole("table");
      expect(tableElement).toBeInTheDocument();

      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(4); // 2 data rows + 1 header row + 1 add row button row

      const cells = screen.getAllByRole("gridcell");
      expect(cells).toHaveLength(6); // 2 rows * 3 columns = 6 gridcells
    });

    it("should render cell content", () => {
      const table = createTable(2, 2);
      table.cells[0][0].text = "Header 1";
      table.cells[0][1].text = "Header 2";
      table.cells[1][0].text = "Cell 1";
      table.cells[1][1].text = "Cell 2";

      render(<TableEditor table={table} />);

      expect(screen.getByText("Header 1")).toBeInTheDocument();
      expect(screen.getByText("Header 2")).toBeInTheDocument();
      expect(screen.getByText("Cell 1")).toBeInTheDocument();
      expect(screen.getByText("Cell 2")).toBeInTheDocument();
    });

    it("should apply cell styles", () => {
      const table = createTable(1, 1);
      table.cells[0][0].text = "Styled Cell";
      table.cells[0][0].style = {
        fontWeight: "bold",
        color: "#ff0000",
        fontFamily: "Times",
        textAlign: "center",
        backgroundColor: "#ffffff",
        borderColor: {
          top: "#000000",
          right: "#000000",
          bottom: "#000000",
          left: "#000000",
        },
      };

      render(<TableEditor table={table} />);

      const cell = screen.getByText("Styled Cell");
      expect(cell).toHaveStyle({
        fontWeight: "bold",
        color: "#ff0000",
        fontFamily: "Times",
        textAlign: "center",
      });
    });

    it("should handle merged cells with colspan and rowspan", () => {
      const table = createTable(3, 3);
      table.cells[0][0].text = "Merged Cell";
      table.cells[0][0].colSpan = 2;
      table.cells[0][0].rowSpan = 1;
      table.cells[0][1].merged = true;

      render(<TableEditor table={table} />);

      const mergedCell = screen.getByText("Merged Cell");
      expect(mergedCell.closest("td")).toHaveAttribute("colspan", "2");
    });
  });

  describe("interactions", () => {
    it("should call onCellClick when cell is clicked", async () => {
      const user = userEvent.setup();
      const table = createTable(2, 2);
      const mockOnCellClick = vi.fn();

      render(<TableEditor table={table} onCellClick={mockOnCellClick} />);

      const cell = screen.getAllByRole("gridcell")[0];
      await user.click(cell);

      expect(mockOnCellClick).toHaveBeenCalledWith(0, 0);
    });

    it("should call onCellChange when cell content is edited", async () => {
      const user = userEvent.setup();
      const table = createTable(1, 1);
      const mockOnCellChange = vi.fn();

      render(<TableEditor table={table} onCellChange={mockOnCellChange} />);

      const cell = screen.getAllByRole("gridcell")[0];
      await user.dblClick(cell);

      const input = screen.getByRole("textbox");
      await user.type(input, "New content");
      await user.keyboard("{Enter}");

      expect(mockOnCellChange).toHaveBeenCalledWith(0, 0, "New content");
    });
  });
});
