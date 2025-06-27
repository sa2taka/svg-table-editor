import { test, expect } from '@playwright/test';

test.describe('TSV Import and Export Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();
  });

  test('should open TSV import modal', async ({ page }) => {
    // TSVインポートボタンをクリック
    await page.getByRole('button', { name: /tsv/i }).click();
    
    // モーダルが表示されることを確認
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // モーダル内の要素確認
    await expect(page.getByText('TSVインポート')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByRole('button', { name: 'サンプルデータを読み込み' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'クリア' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'インポート' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('should close modal with overlay click', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // オーバーレイをクリック（モーダル外側）
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
    
    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();
  });

  test('should close modal with cancel button', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();
    
    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();
  });

  test('should load sample TSV data', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    // サンプルデータを読み込み
    await page.getByRole('button', { name: 'サンプルデータを読み込み' }).click();
    
    // テキストエリアにサンプルデータが入力されることを確認
    const textarea = page.locator('textarea');
    const content = await textarea.inputValue();
    expect(content).toContain('名前\t年齢\t職業');
    expect(content).toContain('田中太郎\t30\tエンジニア');
    expect(content).toContain('佐藤花子\t25\tデザイナー');
    
    // バリデーション結果が表示されることを確認
    await expect(page.getByText('✓ 有効なTSVです')).toBeVisible();
    await expect(page.getByText('4行 × 3列のテーブルが作成されます。')).toBeVisible();
    
    // インポートボタンが有効になることを確認
    const importButton = page.getByRole('button', { name: 'インポート' });
    await expect(importButton).toBeEnabled();
  });

  test('should clear TSV data', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    // サンプルデータを読み込み
    await page.getByRole('button', { name: 'サンプルデータを読み込み' }).click();
    
    const textarea = page.locator('textarea');
    expect(await textarea.inputValue()).not.toBe('');
    
    // クリアボタンをクリック
    await page.getByRole('button', { name: 'クリア' }).click();
    
    // テキストエリアが空になることを確認
    expect(await textarea.inputValue()).toBe('');
    
    // バリデーション結果が消えることを確認
    await expect(page.getByText('✓ 有効なTSVです')).not.toBeVisible();
  });

  test('should validate TSV data format', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    const textarea = page.locator('textarea');
    
    // 有効なTSVデータ
    await textarea.fill('列1\t列2\t列3\nデータ1\tデータ2\tデータ3');
    await page.waitForTimeout(300); // バリデーション待機
    await expect(page.getByText('✓ 有効なTSVです')).toBeVisible();
    await expect(page.getByText('行数: 2, 列数: 3')).toBeVisible();
    
    // 不正なデータ（列数不一致）
    await textarea.fill('列1\t列2\t列3\nデータ1\tデータ2'); // 列数が足りない
    await page.waitForTimeout(300);
    await expect(page.getByText('✗ TSVに問題があります')).toBeVisible();
    await expect(page.getByText('2行目の列数が一致しません')).toBeVisible();
    
    // 空のデータ
    await textarea.fill('');
    await page.waitForTimeout(300);
    await expect(page.getByText('TSVデータを入力してください')).toBeVisible();
  });

  test('should import TSV data and replace table', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    // カスタムTSVデータを入力
    const tsvData = 'ヘッダー1\tヘッダー2\tヘッダー3\n値1\t値2\t値3\n値4\t値5\t値6';
    await page.locator('textarea').fill(tsvData);
    
    // インポートボタンをクリック
    await page.getByRole('button', { name: 'インポート' }).click();
    
    // 確認ダイアログが表示されることを確認
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('TSVデータをインポートしますか？');
      dialog.accept();
    });
    
    // モーダルが閉じることを確認
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // テーブルがTSVデータで置き換えられることを確認
    await expect(page.getByRole('gridcell', { name: 'ヘッダー1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'ヘッダー2' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'ヘッダー3' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '値1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '値2' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '値3' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '値4' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '値5' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '値6' })).toBeVisible();
    
    // テーブルサイズが正しいことを確認（3行：2データ行 + ヘッダー行 + 行追加ボタン行）
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(4);
  });

  test('should cancel TSV import', async ({ page }) => {
    // 現在のセル内容を確認
    await expect(page.getByRole('gridcell', { name: 'Cell (1,1)' })).toBeVisible();
    
    await page.getByRole('button', { name: /tsv/i }).click();
    await page.getByRole('button', { name: 'サンプルデータを読み込み' }).click();
    
    // インポートボタンをクリック
    await page.getByRole('button', { name: 'インポート' }).click();
    
    // 確認ダイアログでキャンセル
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('TSVデータをインポートしますか？');
      dialog.dismiss();
    });
    
    // モーダルは開いたまま
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // 元のテーブル内容が保持されることを確認
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByRole('gridcell', { name: 'Cell (1,1)' })).toBeVisible();
  });

  test('should handle large TSV data with performance warning', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    // 大きなTSVデータを作成（50行 × 10列）
    const headers = Array.from({ length: 10 }, (_, i) => `列${i + 1}`).join('\t');
    const rows = Array.from({ length: 49 }, (_, i) => 
      Array.from({ length: 10 }, (_, j) => `セル${i + 1}-${j + 1}`).join('\t')
    );
    const largeTsv = [headers, ...rows].join('\n');
    
    await page.locator('textarea').fill(largeTsv);
    await page.waitForTimeout(500); // バリデーション待機
    
    // パフォーマンス警告が表示されることを確認
    await expect(page.getByText(/パフォーマンスに影響する可能性があります/)).toBeVisible();
    
    // インポートボタンは有効のまま
    const importButton = page.getByRole('button', { name: 'インポート' });
    await expect(importButton).toBeEnabled();
    
    // インポート実行
    await importButton.click();
    
    page.on('dialog', dialog => dialog.accept());
    
    // インポートが完了することを確認（時間制限付き）
    await expect(page.getByRole('gridcell', { name: '列1' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('gridcell', { name: 'セル1-1' })).toBeVisible();
  });

  test('should integrate TSV import with SVG export', async ({ page }) => {
    // TSVインポート
    await page.getByRole('button', { name: /tsv/i }).click();
    await page.getByRole('button', { name: 'サンプルデータを読み込み' }).click();
    await page.getByRole('button', { name: 'インポート' }).click();
    
    page.on('dialog', dialog => dialog.accept());
    
    // インポート完了を確認
    await expect(page.getByRole('gridcell', { name: '田中太郎' })).toBeVisible();
    
    // SVGプレビューを開く
    await page.getByRole('button', { name: /preview/i }).click();
    
    // プレビューモーダルが表示されることを確認
    const previewModal = page.getByRole('dialog');
    await expect(previewModal).toBeVisible();
    await expect(page.getByText('SVGプレビュー')).toBeVisible();
    
    // SVG要素が含まれていることを確認
    const svgElement = page.locator('svg');
    await expect(svgElement).toBeVisible();
    
    // SVG内にテーブルデータが含まれていることを確認
    const svgContent = await svgElement.innerHTML();
    expect(svgContent).toContain('田中太郎');
    expect(svgContent).toContain('エンジニア');
    
    // ダウンロードボタンをテスト
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download/i }).click();
    const download = await downloadPromise;
    
    // ファイル名形式の確認
    expect(download.suggestedFilename()).toMatch(/^table-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.svg$/);
    
    // モーダルを閉じる
    await page.getByRole('button', { name: /close/i }).click();
    await expect(previewModal).not.toBeVisible();
  });

  test('should handle special characters in TSV data', async ({ page }) => {
    await page.getByRole('button', { name: /tsv/i }).click();
    
    // 特殊文字を含むTSVデータ
    const specialTsv = '名前\t記号\t説明\n山田"太郎"\t<tag>\t"引用符テスト"\n田中&花子\t#ハッシュ\t改行\nテスト';
    await page.locator('textarea').fill(specialTsv);
    
    await page.getByRole('button', { name: 'インポート' }).click();
    page.on('dialog', dialog => dialog.accept());
    
    // 特殊文字が正しく処理されることを確認
    await expect(page.getByRole('gridcell', { name: '山田"太郎"' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '<tag>' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '"引用符テスト"' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '田中&花子' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '#ハッシュ' })).toBeVisible();
  });
});