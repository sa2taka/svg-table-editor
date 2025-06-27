import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TSVImportModal } from "../../src/components/TSVImportModal.js";
import { generateSampleTSV } from "../../src/utils/tsvImporter.js";

describe("TSVImportModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("モーダルが閉じている時は何も表示しない", () => {
    render(<TSVImportModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("TSVインポート")).not.toBeInTheDocument();
  });

  it("モーダルが開いている時に適切な要素を表示する", () => {
    render(<TSVImportModal {...defaultProps} />);

    expect(screen.getByText("TSVインポート")).toBeInTheDocument();
    expect(screen.getByLabelText("TSVテキスト:")).toBeInTheDocument();
    expect(screen.getByText("サンプルデータを読み込み")).toBeInTheDocument();
    expect(screen.getByText("クリア")).toBeInTheDocument();
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
    expect(screen.getByText("インポート")).toBeInTheDocument();
  });

  it("キャンセルボタンクリックでonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(<TSVImportModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("キャンセル"));

    expect(onClose).toHaveBeenCalled();
  });

  it("×ボタンクリックでonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(<TSVImportModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("✕"));

    expect(onClose).toHaveBeenCalled();
  });

  it("サンプルデータボタンでサンプルTSVが読み込まれる", async () => {
    render(<TSVImportModal {...defaultProps} />);

    fireEvent.click(screen.getByText("サンプルデータを読み込み"));

    const textarea = screen.getByLabelText("TSVテキスト:");
    expect((textarea as HTMLTextAreaElement).value).toBe(generateSampleTSV());

    // バリデーション結果が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("✓ 有効なTSVです")).toBeInTheDocument();
    });
  });

  it("クリアボタンでテキストエリアがクリアされる", async () => {
    render(<TSVImportModal {...defaultProps} />);

    // まずサンプルデータを読み込む
    fireEvent.click(screen.getByText("サンプルデータを読み込み"));

    const textarea = screen.getByLabelText("TSVテキスト:");
    expect((textarea as HTMLTextAreaElement).value).not.toBe("");

    // クリアボタンをクリック
    fireEvent.click(screen.getByText("クリア"));

    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("有効なTSVを入力すると成功メッセージが表示される", async () => {
    render(<TSVImportModal {...defaultProps} />);

    const textarea = screen.getByLabelText("TSVテキスト:");
    fireEvent.change(textarea, {
      target: { value: "A\tB\nC\tD" },
    });

    await waitFor(() => {
      expect(screen.getByText("✓ 有効なTSVです")).toBeInTheDocument();
      expect(screen.getByText(/2行 × 2列のテーブルが作成されます/)).toBeInTheDocument();
    });
  });

  it("空のTSVを入力するとインポートボタンが無効になる", () => {
    render(<TSVImportModal {...defaultProps} />);

    const textarea = screen.getByLabelText("TSVテキスト:");
    const importButton = screen.getByText("インポート");

    // 初期状態ではインポートボタンが無効
    expect(importButton).toBeDisabled();

    // 空のテキストを入力
    fireEvent.change(textarea, {
      target: { value: "" },
    });

    // 依然として無効
    expect(importButton).toBeDisabled();
  });

  it("警告がある場合は警告メッセージが表示される", async () => {
    render(<TSVImportModal {...defaultProps} />);

    const textarea = screen.getByLabelText("TSVテキスト:");
    // 列数が不一致のTSV
    fireEvent.change(textarea, {
      target: { value: "A\tB\tC\nX\tY\nP" },
    });

    await waitFor(() => {
      expect(screen.getByText("⚠ 警告")).toBeInTheDocument();
      expect(screen.getByText(/行によって列数が異なります/)).toBeInTheDocument();
    });
  });

  it("有効なTSVがある時のみインポートボタンが有効になる", async () => {
    render(<TSVImportModal {...defaultProps} />);

    const importButton = screen.getByText("インポート");

    // 初期状態では無効
    expect(importButton).toBeDisabled();

    // 有効なTSVを入力
    const textarea = screen.getByLabelText("TSVテキスト:");
    fireEvent.change(textarea, {
      target: { value: "A\tB\nC\tD" },
    });

    await waitFor(() => {
      expect(importButton).not.toBeDisabled();
    });
  });

  it("インポートボタンクリックでonImportが呼ばれる", async () => {
    const onImport = vi.fn();
    render(<TSVImportModal {...defaultProps} onImport={onImport} />);

    // 有効なTSVを入力
    const textarea = screen.getByLabelText("TSVテキスト:");
    fireEvent.change(textarea, {
      target: { value: "A\tB\nC\tD" },
    });

    // インポートボタンが有効になるまで待つ
    await waitFor(() => {
      expect(screen.getByText("インポート")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText("インポート"));

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: 2,
        columns: 2,
        cells: expect.any(Array),
      })
    );
  });

  it("インポート機能の基本動作確認", () => {
    const onClose = vi.fn();
    const onImport = vi.fn();
    render(<TSVImportModal {...defaultProps} onClose={onClose} onImport={onImport} />);

    // モーダルが開いていることを確認
    expect(screen.getByText("TSVインポート")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onImport).not.toHaveBeenCalled();
  });
});
