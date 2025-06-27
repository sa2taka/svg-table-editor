import { describe, expect, it } from "vitest";
import { generateSampleTSV, parseTSVToTable, validateTSV } from "../../src/utils/tsvImporter.js";

describe("TSV Importer", () => {
  describe("parseTSVToTable", () => {
    it("空文字列から1x1テーブルを作成する", () => {
      const table = parseTSVToTable("");

      expect(table.rows).toBe(1);
      expect(table.columns).toBe(1);
      expect(table.cells[0][0].text).toBe("");
    });

    it("単一行のTSVからテーブルを作成する", () => {
      const tsv = "列1\t列2\t列3";
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(1);
      expect(table.columns).toBe(3);
      expect(table.cells[0][0].text).toBe("列1");
      expect(table.cells[0][1].text).toBe("列2");
      expect(table.cells[0][2].text).toBe("列3");
    });

    it("複数行のTSVからテーブルを作成する", () => {
      const tsv = "名前\t年齢\n田中太郎\t30\n佐藤花子\t25";
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(3);
      expect(table.columns).toBe(2);
      expect(table.cells[0][0].text).toBe("名前");
      expect(table.cells[0][1].text).toBe("年齢");
      expect(table.cells[1][0].text).toBe("田中太郎");
      expect(table.cells[1][1].text).toBe("30");
      expect(table.cells[2][0].text).toBe("佐藤花子");
      expect(table.cells[2][1].text).toBe("25");
    });

    it("不揃いな列数のTSVを処理する", () => {
      const tsv = "A\tB\tC\nX\tY\nP";
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(3);
      expect(table.columns).toBe(3); // 最大列数
      expect(table.cells[0][0].text).toBe("A");
      expect(table.cells[0][1].text).toBe("B");
      expect(table.cells[0][2].text).toBe("C");
      expect(table.cells[1][0].text).toBe("X");
      expect(table.cells[1][1].text).toBe("Y");
      expect(table.cells[1][2].text).toBe(""); // 不足分は空文字
      expect(table.cells[2][0].text).toBe("P");
      expect(table.cells[2][1].text).toBe(""); // 不足分は空文字
      expect(table.cells[2][2].text).toBe(""); // 不足分は空文字
    });

    it("異なる改行コード（CRLF、LF、CR）を処理する", () => {
      const tsvCRLF = "A\tB\r\nC\tD";
      const tsvLF = "A\tB\nC\tD";
      const tsvCR = "A\tB\rC\tD";

      [tsvCRLF, tsvLF, tsvCR].forEach((tsv) => {
        const table = parseTSVToTable(tsv);
        expect(table.rows).toBe(2);
        expect(table.columns).toBe(2);
        expect(table.cells[0][0].text).toBe("A");
        expect(table.cells[0][1].text).toBe("B");
        expect(table.cells[1][0].text).toBe("C");
        expect(table.cells[1][1].text).toBe("D");
      });
    });

    it("空行を無視する", () => {
      const tsv = "A\tB\n\n\nC\tD\n\n";
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(2);
      expect(table.columns).toBe(2);
      expect(table.cells[0][0].text).toBe("A");
      expect(table.cells[1][0].text).toBe("C");
    });

    it("セルのデフォルトプロパティが正しく設定される", () => {
      const tsv = "Test";
      const table = parseTSVToTable(tsv);
      const cell = table.cells[0][0];

      expect(cell.row).toBe(0);
      expect(cell.column).toBe(0);
      expect(cell.text).toBe("Test");
      expect(cell.merged).toBe(false);
      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);
      expect(cell.style).toBeDefined();
    });
  });

  describe("validateTSV", () => {
    it("空文字列を無効とする", () => {
      const result = validateTSV("");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("TSVテキストが空です");
      expect(result.rowCount).toBe(0);
      expect(result.columnCount).toBe(0);
    });

    it("有効なTSVを検証する", () => {
      const tsv = "A\tB\tC\nX\tY\tZ";
      const result = validateTSV(tsv);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.rowCount).toBe(2);
      expect(result.columnCount).toBe(3);
    });

    it("列数の不一致を警告する", () => {
      const tsv = "A\tB\tC\nX\tY\nP";
      const result = validateTSV(tsv);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("行によって列数が異なります（1〜3列）");
      expect(result.rowCount).toBe(3);
      expect(result.columnCount).toBe(3);
    });

    it("大きすぎるテーブルを警告する", () => {
      // 101行のTSVを生成
      const rows = Array.from({ length: 101 }, (_, i) => `Row${i}\tData${i}`);
      const tsv = rows.join("\n");
      const result = validateTSV(tsv);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("行数が多すぎます"))).toBe(true);
    });

    it("列数が多すぎる場合を警告する", () => {
      // 51列のTSVを生成
      const columns = Array.from({ length: 51 }, (_, i) => `Col${i}`);
      const tsv = columns.join("\t");
      const result = validateTSV(tsv);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("列数が多すぎます"))).toBe(true);
    });
  });

  describe("generateSampleTSV", () => {
    it("サンプルTSVを生成する", () => {
      const sample = generateSampleTSV();

      expect(sample).toContain("名前\t年齢\t職業\t住所");
      expect(sample).toContain("田中太郎\t30\tエンジニア\t東京都");

      // 生成されたサンプルが有効なTSVであることを確認
      const result = validateTSV(sample);
      expect(result.isValid).toBe(true);
      expect(result.rowCount).toBe(4);
      expect(result.columnCount).toBe(4);
    });

    it("生成されたサンプルからテーブルを作成できる", () => {
      const sample = generateSampleTSV();
      const table = parseTSVToTable(sample);

      expect(table.rows).toBe(4);
      expect(table.columns).toBe(4);
      expect(table.cells[0][0].text).toBe("名前");
      expect(table.cells[1][0].text).toBe("田中太郎");
    });
  });

  describe("エッジケーステスト", () => {
    it("タブのみの行を処理する", () => {
      const tsv = "A\tB\tC\tD";
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(1);
      expect(table.columns).toBe(4);
      expect(table.cells[0][0].text).toBe("A");
      expect(table.cells[0][1].text).toBe("B");
      expect(table.cells[0][2].text).toBe("C");
      expect(table.cells[0][3].text).toBe("D");
    });

    it("特殊文字を含むデータを処理する", () => {
      const tsv = '改行\\n含む\t"引用符"含む\t😀絵文字含む';
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(1);
      expect(table.columns).toBe(3);
      expect(table.cells[0][0].text).toBe("改行\\n含む");
      expect(table.cells[0][1].text).toBe('"引用符"含む');
      expect(table.cells[0][2].text).toBe("😀絵文字含む");
    });

    it("空白とタブを含む内容を処理する", () => {
      const tsv = "データ1\tデータ2\nA\tB\tC";
      const table = parseTSVToTable(tsv);

      expect(table.rows).toBe(2);
      expect(table.columns).toBe(3); // 最大3列
      expect(table.cells[0][0].text).toBe("データ1");
      expect(table.cells[0][1].text).toBe("データ2");
      expect(table.cells[1][0].text).toBe("A");
      expect(table.cells[1][1].text).toBe("B");
      expect(table.cells[1][2].text).toBe("C");
    });
  });
});
