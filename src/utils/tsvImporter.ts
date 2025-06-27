import { CellData, createTable, DEFAULT_STYLE, TableDataModel } from "../models/TableDataModel.js";

/**
 * TSVテキストを解析してTableDataModelを生成します
 * @param tsvText TSV形式のテキスト
 * @returns 生成されたTableDataModel
 */
export function parseTSVToTable(tsvText: string): TableDataModel {
  // 空文字列や無効な入力のハンドリング
  if (!tsvText || tsvText.trim().length === 0) {
    return createTable(1, 1);
  }

  // 行に分割（CRLF、LF、CRに対応）
  const lines = tsvText.split(/\r\n|\n|\r/);

  // 空行以外の行のみを処理対象とする
  const nonEmptyLines = lines.filter((line) => line.length > 0);

  if (nonEmptyLines.length === 0) {
    return createTable(1, 1);
  }

  // 各行をタブで分割
  const rows = nonEmptyLines.map((line) => line.split("\t"));

  // 最大列数を計算
  const maxColumns = Math.max(...rows.map((row) => row.length));
  const rowCount = rows.length;

  // 最小サイズを確保
  const finalRowCount = Math.max(1, rowCount);
  const finalColumnCount = Math.max(1, maxColumns);

  // 基本テーブルを作成
  const table = createTable(finalRowCount, finalColumnCount);

  // TSVデータでセルを埋める
  for (let rowIndex = 0; rowIndex < finalRowCount; rowIndex++) {
    for (let colIndex = 0; colIndex < finalColumnCount; colIndex++) {
      const cellText = rows[rowIndex]?.[colIndex] ?? "";

      // セルデータを更新
      table.cells[rowIndex][colIndex] = {
        row: rowIndex,
        column: colIndex,
        text: cellText,
        style: { ...DEFAULT_STYLE },
        merged: false,
        rowSpan: 1,
        colSpan: 1,
      } as CellData;
    }
  }

  return table;
}

/**
 * サンプルTSVテキストを生成します
 */
export function generateSampleTSV(): string {
  return [
    "名前\t年齢\t職業\t住所",
    "田中太郎\t30\tエンジニア\t東京都",
    "佐藤花子\t25\tデザイナー\t大阪府",
    "山田次郎\t35\t営業\t愛知県",
  ].join("\n");
}

/**
 * TSVテキストの妥当性をチェックします
 * @param tsvText TSV形式のテキスト
 * @returns バリデーション結果
 */
export function validateTSV(tsvText: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tsvText || tsvText.trim().length === 0) {
    errors.push("TSVテキストが空です");
    return {
      isValid: false,
      errors,
      warnings,
      rowCount: 0,
      columnCount: 0,
    };
  }

  const lines = tsvText.split(/\r\n|\n|\r/);
  const nonEmptyLines = lines.filter((line) => line.length > 0);

  if (nonEmptyLines.length === 0) {
    errors.push("有効な行がありません");
    return {
      isValid: false,
      errors,
      warnings,
      rowCount: 0,
      columnCount: 0,
    };
  }

  const rows = nonEmptyLines.map((line) => line.split("\t"));
  const columnCounts = rows.map((row) => row.length);
  const maxColumns = Math.max(...columnCounts);
  const minColumns = Math.min(...columnCounts);

  // 列数の不一致を警告
  if (maxColumns !== minColumns) {
    warnings.push(`行によって列数が異なります（${minColumns}〜${maxColumns}列）`);
  }

  // 大きすぎるテーブルを警告
  if (rows.length > 100) {
    warnings.push(`行数が多すぎます（${rows.length}行）。パフォーマンスに影響する可能性があります。`);
  }

  if (maxColumns > 50) {
    warnings.push(`列数が多すぎます（${maxColumns}列）。パフォーマンスに影響する可能性があります。`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: rows.length,
    columnCount: maxColumns,
  };
}
