# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

SVG Table Editor - WYSIWYGによるTable作成に特化したSVGエディタ
- React + TypeScript + Vite
- セル結合、文字装飾、SVG出力機能
- Excel風の境界線制御、テーブルサイズ変更機能
- 静的ファイルとして動作（サーバー処理なし）
- URL状態永続化（LZ-String圧縮によるURL短縮）

## 開発サイクル

1. `docs/tasks/` 以下に `nnn_<taskName>.md` の形式で実行するタスクを記載します
2. タスクの内容を確認しながら実装を行います
3. 実装はテストの内容を考える -> テストの内容を実装する -> 本実装を行う -> テストが通ることを確認する、のTDDを実践します
4. タスクが完了するたび、lint、型チェック、テストが通ることを毎回必ず確認します
5. 最後に一般的なリファクタリング、とくにDRY・SLAP原則を重視してリファクタリングを行った後、再度lint, 型チェック、テストの実行を行います

## コード規約

- 関数は `const hoge = () => { }` の形式を優先して利用してください
- Classは可能な限り利用しないでください。

## 必須コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド (GitHub Pages向けdocs/ディレクトリに出力)
npm run build

# Lint + Prettier チェック
npm run lint

# テスト実行
npm run test

# 単一テストファイル実行 (例: テストファイル名の一部を指定)
npm run test -- ColorPalette
npm run test -- components/ColorPalette

# 型チェック
npx tsc --noEmit

# Prettier自動修正
npx prettier --write src/ __tests__/
```

## テスト構造

テストファイルは `src/` と同じディレクトリ構造で `__tests__/` 以下に配置：

```
__tests__/
├── App.test.tsx                    # App本体のテスト
├── components/                     # コンポーネントテスト
│   ├── ColorPalette.test.tsx
│   └── TableEditor.test.tsx
├── models/                         # モデルテスト  
│   ├── CellSelection.test.tsx
│   └── TableDataModel.test.tsx
├── utils/                          # ユーティリティテスト
│   ├── svgExporter.test.tsx
│   └── urlStateManager.test.tsx
└── *Integration.test.tsx           # 統合テスト（ルートレベル）
```

## アーキテクチャ

### データモデル設計
- **不変性パターン**: 全てのテーブル操作は新しいインスタンスを返す（例: `setCellText(table, row, col, text)` → 新しいTableDataModel）
- **セル基盤アーキテクチャ**: 各セルが位置、内容、スタイル、結合情報を含む
- **リッチセルモデル**: 複雑な境界線、スパン、スタイリングをサポート
- **バリデーション分離**: 操作の検証と実行を分離

### 状態管理パターン
- **単方向データフロー**: App → TableEditor → イベント → 状態更新
- **不変更新**: 全てのテーブル変更が新しい状態オブジェクトを作成
- **選択状態同期**: 選択状態がテーブル境界に対して自動検証される
- **URL状態永続化**: lz-string圧縮によるテーブル状態のURL保存

### コンポーネント階層
```
App (状態コンテナ + URL状態管理)
├── Toolbar (UI制御)
│   ├── ColorPalette (再利用可能カラーUI)
│   ├── BorderColorPicker (個別境界線制御)
│   └── ExcelBorderPicker (グリッド境界線制御)
├── TableEditor (コアテーブルUI + セル編集)
└── SVGPreviewModal (SVG出力プレビュー)
```

### 主要抽象化
- **TableDataModel**: ビジネスロジックの中核抽象化
  - セル操作: `setCellText`, `setCellStyle`, `mergeCells`, `splitCells`
  - テーブル操作: `addRow`, `addColumn`, `removeRow`, `removeColumn`
- **CellSelection**: 選択動作のカプセル化
  - 範囲選択の計算とバリデーション
- **BorderStyle/GridBorderStyle**: リッチな境界線モデリング
- **SVGExportOptions**: エクスポート設定の抽象化
  - 固定サイズ vs レスポンシブモード
- **AppState**: URL永続化対象の状態（table + selection）

### URL状態管理システム
- **圧縮戦略**: テーブルデータをMinimizedStateに変換してlz-string圧縮
- **後方互換性**: 旧Base64形式との互換性維持
- **自動保存**: 状態変更時の自動URL更新（スロットリング付き）

### SVGエクスポート機能
- **固定モード**: セル幅/高さ固定でのSVG生成
- **レスポンシブモード**: テキスト長に応じた動的セルサイズ調整
- **テキスト測定**: Canvas APIによる正確なテキスト幅計算

### テストパターン
- **包括的テストカバレッジ**: 単体テスト、エッジケース、統合テスト
- **状態検証**: 不変性と一貫性の保証
- **記述的テスト構造**: 明確なdescribe/itブロック
- **統合テスト**: ユーザーインタラクションの完全なフロー検証

### 拡張ポイント
- **エクスポート形式**: PDF、PNG エクスポーターの追加が容易
- **セルタイプ**: ドロップダウン、チェックボックス、画像セルの追加可能
- **境界線スタイル**: 破線、点線、太線の境界線追加可能
- **テーマ**: カラースキームとスタイリングシステム

### 参考リソース
- **サンプルSVG**: `sample-svgs/` 以下に参考となるSVGファイルが保存されています
- **設計ドキュメント**: `docs/designs/` 以下にプロジェクト設計資料
- **タスク管理**: `docs/tasks/` 以下に実装チェックリストと改善案