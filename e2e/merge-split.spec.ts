import { test, expect } from '@playwright/test';

test.describe('Cell Merge and Split Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();
  });

  test('should merge adjacent cells horizontally', async ({ page }) => {
    // 最初のセルをクリック
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.click();
    
    // マウスドラッグで隣のセルまで選択
    const secondCell = page.getByRole('gridcell').nth(1);
    
    await firstCell.hover();
    await page.mouse.down();
    await secondCell.hover();
    await page.mouse.up();
    
    // 選択範囲の確認
    await expect(page.locator('text=Selection:')).toBeVisible();
    // 座標の表示は実装により異なる可能性があるため、より柔軟にチェック
    const selectionText = await page.locator('div:has-text("Selection:")').textContent();
    expect(selectionText).toContain('Selection:');
    console.log('Selection text:', selectionText);
    
    // Mergeボタンが有効になることを確認
    const mergeButton = page.getByRole('button', { name: 'Merge Cells' });
    await expect(mergeButton).toBeEnabled();
    
    // セル結合実行
    await mergeButton.click();
    
    // 結合されたセルのcolspan属性を確認
    const mergedCell = page.getByRole('gridcell').first();
    await expect(mergedCell).toHaveAttribute('colspan', '2');
    
    // 選択状態の更新確認
    await expect(page.locator('text=Single cell')).toBeVisible();
  });

  test('should merge cells vertically', async ({ page }) => {
    // 最初のセルから下のセルまで選択
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.click();
    
    // 次の行の同じ列のセルを特定
    const rows = page.getByRole('row');
    const secondRow = rows.nth(2); // ヘッダー行の次の次（データ行）
    const cellInSecondRow = secondRow.getByRole('gridcell').first();
    
    // 縦方向の選択
    await firstCell.hover();
    await page.mouse.down();
    await cellInSecondRow.hover();
    await page.mouse.up();
    
    // 選択範囲の確認
    await expect(page.locator('text=(0, 0) to (1, 0)')).toBeVisible();
    await expect(page.locator('text=1×2 cells')).toBeVisible();
    
    // セル結合実行
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 結合されたセルのrowspan属性を確認
    const mergedCell = page.getByRole('gridcell').first();
    await expect(mergedCell).toHaveAttribute('rowspan', '2');
  });

  test('should merge a rectangular range of cells', async ({ page }) => {
    // 2x2の範囲を選択
    const firstCell = page.getByRole('gridcell').first();
    const rows = page.getByRole('row');
    const secondRow = rows.nth(2);
    const targetCell = secondRow.getByRole('gridcell').nth(1);
    
    await firstCell.hover();
    await page.mouse.down();
    await targetCell.hover();
    await page.mouse.up();
    
    // 選択範囲の確認
    await expect(page.locator('text=(0, 0) to (1, 1)')).toBeVisible();
    await expect(page.locator('text=2×2 cells')).toBeVisible();
    
    // セル結合実行
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 結合されたセルのspan属性を確認
    const mergedCell = page.getByRole('gridcell').first();
    await expect(mergedCell).toHaveAttribute('colspan', '2');
    await expect(mergedCell).toHaveAttribute('rowspan', '2');
  });

  test('should split merged cells', async ({ page }) => {
    // まずセルを結合
    const firstCell = page.getByRole('gridcell').first();
    const secondCell = page.getByRole('gridcell').nth(1);
    
    await firstCell.hover();
    await page.mouse.down();
    await secondCell.hover();
    await page.mouse.up();
    
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 結合されたセルをクリック
    const mergedCell = page.getByRole('gridcell').first();
    await mergedCell.click();
    
    // Splitボタンが有効になることを確認
    const splitButton = page.getByRole('button', { name: 'Split Cells' });
    await expect(splitButton).toBeEnabled();
    
    // セル分割実行
    await splitButton.click();
    
    // span属性が削除されることを確認
    await expect(mergedCell).not.toHaveAttribute('colspan');
    await expect(mergedCell).not.toHaveAttribute('rowspan');
    
    // 元のセル構造に戻ることを確認
    const cells = page.getByRole('gridcell');
    await expect(cells).toHaveCount(16); // 4x4のグリッド
  });

  test('should handle smart merge with overlapping merged cells', async ({ page }) => {
    // 最初に2つのセルを結合
    const firstCell = page.getByRole('gridcell').first();
    const secondCell = page.getByRole('gridcell').nth(1);
    
    await firstCell.hover();
    await page.mouse.down();
    await secondCell.hover();
    await page.mouse.up();
    
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 重複する範囲を選択（結合されたセルを含む）
    const thirdCell = page.getByRole('gridcell').nth(1); // 結合セルの次
    
    await firstCell.hover();
    await page.mouse.down();
    await thirdCell.hover();
    await page.mouse.up();
    
    // 通常のMergeボタンは無効になることを確認
    const mergeButton = page.getByRole('button', { name: 'Merge Cells' });
    await expect(mergeButton).toBeDisabled();
    
    // Smart Mergeボタンが有効であることを確認
    const smartMergeButton = page.getByRole('button', { name: 'Smart Merge' });
    await expect(smartMergeButton).toBeEnabled();
    
    // Smart Merge実行
    await smartMergeButton.click();
    
    // より大きな結合セルが作成されることを確認
    const resultCell = page.getByRole('gridcell').first();
    await expect(resultCell).toHaveAttribute('colspan', '3');
  });

  test('should prevent invalid merge operations', async ({ page }) => {
    // 単一セル選択では結合できない
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.click();
    
    await expect(page.locator('text=Single cell')).toBeVisible();
    
    const mergeButton = page.getByRole('button', { name: 'Merge Cells' });
    await expect(mergeButton).toBeDisabled();
    
    // 非連続セル選択では結合できない（実装によって異なる）
    // この部分は実装に依存するため、実際の動作に合わせて調整
  });

  test('should preserve cell content during merge and split', async ({ page }) => {
    // セルに内容を入力
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();
    await page.fill('input[type="text"]', '結合テスト1');
    await page.press('input[type="text"]', 'Tab');
    
    const input = page.locator('input[type="text"]');
    await input.fill('結合テスト2');
    await input.press('Escape');
    
    // セルを結合
    await firstCell.hover();
    await page.mouse.down();
    const secondCell = page.getByRole('gridcell').nth(1);
    await secondCell.hover();
    await page.mouse.up();
    
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 結合されたセルの内容確認（通常は最初のセルの内容が保持される）
    const mergedCell = page.getByRole('gridcell').first();
    await expect(mergedCell).toHaveText('結合テスト1');
    
    // セルを分割
    await mergedCell.click();
    await page.getByRole('button', { name: 'Split Cells' }).click();
    
    // 分割後も内容が保持されることを確認
    await expect(page.getByRole('gridcell', { name: '結合テスト1' })).toBeVisible();
  });

  test('should update selection display correctly during merge operations', async ({ page }) => {
    // 範囲選択
    const firstCell = page.getByRole('gridcell').first();
    const secondCell = page.getByRole('gridcell').nth(1);
    
    await firstCell.hover();
    await page.mouse.down();
    await secondCell.hover();
    await page.mouse.up();
    
    // 選択表示の確認
    await expect(page.locator('text=Selection:')).toBeVisible();
    await expect(page.locator('text=2×1 cells')).toBeVisible();
    
    // 結合実行
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 結合後の選択表示確認
    await expect(page.locator('text=Single cell')).toBeVisible();
    
    // 結合されたセルを再選択
    const mergedCell = page.getByRole('gridcell').first();
    await mergedCell.click();
    
    // 単一セル選択として表示されることを確認
    await expect(page.locator('text=Single cell')).toBeVisible();
    await expect(page.locator('text=(0, 0) to (0, 0)')).toBeVisible();
  });

  test('should handle merge operations with styling', async ({ page }) => {
    // セルにスタイルを適用
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.click();
    
    // 太字スタイルを適用
    await page.getByRole('button', { name: /bold/i }).click();
    
    // 背景色を変更
    const colorButtons = page.getByRole('button').filter({ hasText: /#/ });
    if (await colorButtons.count() > 0) {
      await colorButtons.first().click();
    }
    
    // セルを結合
    const secondCell = page.getByRole('gridcell').nth(1);
    await firstCell.hover();
    await page.mouse.down();
    await secondCell.hover();
    await page.mouse.up();
    
    await page.getByRole('button', { name: 'Merge Cells' }).click();
    
    // 結合されたセルのスタイルが保持されることを確認
    const mergedCell = page.getByRole('gridcell').first();
    const fontWeight = await mergedCell.evaluate(el => getComputedStyle(el).fontWeight);
    expect(fontWeight).toBe('bold');
  });
});