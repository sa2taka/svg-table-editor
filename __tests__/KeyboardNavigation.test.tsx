import { render, screen, fireEvent } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TableEditor } from "../src/components/TableEditor.js";
import { createTable } from "../src/models/TableDataModel.js";

describe("Keyboard Navigation and IME Support", () => {
  const mockOnCellChange = vi.fn();
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("IME Support", () => {
    it("should not trigger Enter key action during IME composition", async () => {
      const user = userEvent.setup();
      const table = createTable(2, 2);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // ダブルクリックして編集モードに入る
      const cells = screen.getAllByRole("gridcell");
      await user.dblClick(cells[0]);

      const input = screen.getByRole("textbox");
      
      // IME変換開始
      fireEvent.compositionStart(input);
      
      // 変換中のEnterキー（無視されるべき）
      fireEvent.keyDown(input, { key: "Enter" });
      
      // セルの変更は発生せず、まだ編集モード
      expect(mockOnCellChange).not.toHaveBeenCalled();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      
      // IME変換終了
      fireEvent.compositionEnd(input);
      
      // 変換終了後のEnterキー（処理されるべき）
      fireEvent.keyDown(input, { key: "Enter" });
      
      // セルの変更が発生し、編集モード終了
      expect(mockOnCellChange).toHaveBeenCalled();
    });

    it("should handle composition events correctly", async () => {
      const table = createTable(2, 2);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 編集モードに入る
      const user = userEvent.setup();
      const cells = screen.getAllByRole("gridcell");
      await user.dblClick(cells[0]);

      const input = screen.getByRole("textbox");
      
      // Clear any initial calls that happened during setup
      vi.clearAllMocks();
      
      // IME変換のシミュレーション
      fireEvent.compositionStart(input);
      
      // 変換中はキーボードナビゲーションが無効
      fireEvent.keyDown(input, { key: "Tab" });
      expect(mockOnSelectionChange).not.toHaveBeenCalled();
      
      fireEvent.compositionEnd(input);
      
      // 変換終了後はキーボードナビゲーションが有効
      fireEvent.keyDown(input, { key: "Tab" });
      expect(mockOnSelectionChange).toHaveBeenCalled();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should navigate to next row with Enter key", async () => {
      const user = userEvent.setup();
      const table = createTable(3, 3);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // テーブルにフォーカスを当てる
      const tableContainer = screen.getByRole("table").parentElement;
      tableContainer?.focus();

      // Enterキーで編集開始
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "Enter" });
      }
      
      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      
      // Enterキーで確定 + 下のセルに移動
      fireEvent.keyDown(input, { key: "Enter" });
      
      expect(mockOnCellChange).toHaveBeenCalledWith(0, 0, "test");
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 1, startColumn: 0, endRow: 1, endColumn: 0
      });
    });

    it("should navigate to previous row with Shift+Enter", async () => {
      const user = userEvent.setup();
      const table = createTable(3, 3);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 1, startColumn: 0, endRow: 1, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 編集モードに入る
      const cells = screen.getAllByRole("gridcell");
      await user.dblClick(cells[3]); // 1行目1列目のセル
      
      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      
      // Shift+Enterで確定 + 上のセルに移動
      fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
      
      expect(mockOnCellChange).toHaveBeenCalledWith(1, 0, "test");
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 0, startColumn: 0, endRow: 0, endColumn: 0
      });
    });

    it("should navigate to next column with Tab key", async () => {
      const user = userEvent.setup();
      const table = createTable(3, 3);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 編集モードに入る
      const cells = screen.getAllByRole("gridcell");
      await user.dblClick(cells[0]);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      
      // Tabキーで確定 + 右のセルに移動
      fireEvent.keyDown(input, { key: "Tab" });
      
      expect(mockOnCellChange).toHaveBeenCalledWith(0, 0, "test");
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 0, startColumn: 1, endRow: 0, endColumn: 1
      });
    });

    it("should navigate to previous column with Shift+Tab", async () => {
      const user = userEvent.setup();
      const table = createTable(3, 3);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 1, endRow: 0, endColumn: 1 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 編集モードに入る
      const cells = screen.getAllByRole("gridcell");
      await user.dblClick(cells[1]); // 0行目1列目のセル
      
      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      
      // Shift+Tabで確定 + 左のセルに移動
      fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
      
      expect(mockOnCellChange).toHaveBeenCalledWith(0, 1, "test");
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 0, startColumn: 0, endRow: 0, endColumn: 0
      });
    });

    it("should cancel editing with Escape key", async () => {
      const user = userEvent.setup();
      const table = createTable(2, 2);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 編集モードに入る
      const cells = screen.getAllByRole("gridcell");
      await user.dblClick(cells[0]);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "test content");
      
      // Escapeキーで編集キャンセル
      fireEvent.keyDown(input, { key: "Escape" });
      
      // セルの変更は発生せず、編集モード終了
      expect(mockOnCellChange).not.toHaveBeenCalled();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("should navigate with arrow keys when not editing", () => {
      const table = createTable(3, 3);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 1, startColumn: 1, endRow: 1, endColumn: 1 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const tableContainer = screen.getByRole("table").parentElement;
      
      // 上矢印キー
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "ArrowUp" });
      }
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 0, startColumn: 1, endRow: 0, endColumn: 1
      });

      // 下矢印キー
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "ArrowDown" });
      }
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 2, startColumn: 1, endRow: 2, endColumn: 1
      });

      // 左矢印キー
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "ArrowLeft" });
      }
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 1, startColumn: 0, endRow: 1, endColumn: 0
      });

      // 右矢印キー
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "ArrowRight" });
      }
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 1, startColumn: 2, endRow: 1, endColumn: 2
      });
    });

    it("should not move beyond table boundaries", () => {
      const table = createTable(2, 2);
      
      render(
        <TableEditor 
          table={table}
          selection={{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 }}
          onCellChange={mockOnCellChange}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const tableContainer = screen.getByRole("table").parentElement;
      
      // 既に最上行なので上矢印キーは移動しない
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "ArrowUp" });
      }
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 0, startColumn: 0, endRow: 0, endColumn: 0
      });

      // 既に最左列なので左矢印キーは移動しない
      if (tableContainer) {
        fireEvent.keyDown(tableContainer, { key: "ArrowLeft" });
      }
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        startRow: 0, startColumn: 0, endRow: 0, endColumn: 0
      });
    });
  });
});