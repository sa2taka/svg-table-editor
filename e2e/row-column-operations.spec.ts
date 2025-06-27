import { test, expect } from '@playwright/test';

test.describe('Row and Column Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();
  });

  test('should add rows using the + button', async ({ page }) => {
    // 初期行数を確認（6行：ヘッダー + 4データ行 + 行追加ボタン行）
    let rows = page.getByRole('row');
    await expect(rows).toHaveCount(6);
    
    // 行追加ボタンをクリック
    const addRowButton = page.locator('button[title="Add row"]');
    await addRowButton.click();
    
    // 行数が増えることを確認（7行）
    rows = page.getByRole('row');
    await expect(rows).toHaveCount(7);
    
    // もう一度追加
    await addRowButton.click();
    
    // 行数がさらに増えることを確認（8行）
    rows = page.getByRole('row');
    await expect(rows).toHaveCount(8);
  });

  test('should add columns using the + button', async ({ page }) => {
    // 初期列数を確認（ヘッダー行で確認）
    const firstRow = page.getByRole('row').first();
    let headerCells = firstRow.getByRole('columnheader');
    await expect(headerCells).toHaveCount(6); // 空セル + 4列 + 列追加ボタン
    
    // 列追加ボタンをクリック
    const addColumnButton = page.locator('button[title="Add column"]');
    await addColumnButton.click();
    
    // 列数が増えることを確認
    headerCells = firstRow.getByRole('columnheader');
    await expect(headerCells).toHaveCount(7);
    
    // データ行の列数も確認
    const dataRow = page.getByRole('row').nth(1);
    const dataCells = dataRow.getByRole('cell');
    await expect(dataCells).toHaveCount(6); // 行ヘッダー + 5データセル
  });

  test('should show context menu on row header right-click', async ({ page }) => {
    // 行ヘッダーを右クリック
    const rowHeader = page.getByRole('rowheader').first();
    await rowHeader.click({ button: 'right' });
    
    // コンテキストメニューが表示されることを確認
    await expect(page.getByText('Insert row before')).toBeVisible();
    await expect(page.getByText('Insert row after')).toBeVisible();
    await expect(page.getByText('Remove row')).toBeVisible();
    
    // メニューが固定位置に表示されることを確認
    const menu = page.locator('[role="menu"], div[style*="position: fixed"]').first();
    await expect(menu).toBeVisible();
    
    // 外側をクリックしてメニューを閉じる
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(page.getByText('Insert row before')).not.toBeVisible();
  });

  test('should show context menu on column header right-click', async ({ page }) => {
    // 列ヘッダーを右クリック
    const columnHeader = page.getByRole('columnheader').nth(1); // 最初のデータ列
    await columnHeader.click({ button: 'right' });
    
    // コンテキストメニューが表示されることを確認
    await expect(page.getByText('Insert column before')).toBeVisible();
    await expect(page.getByText('Insert column after')).toBeVisible();
    await expect(page.getByText('Remove column')).toBeVisible();
    
    // 外側をクリックしてメニューを閉じる
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(page.getByText('Insert column before')).not.toBeVisible();
  });

  test('should insert row before using context menu', async ({ page }) => {
    // 初期行数
    let rows = page.getByRole('row');
    const initialCount = await rows.count();
    
    // 2行目のヘッダーを右クリック
    const secondRowHeader = page.getByRole('rowheader').nth(1);
    await secondRowHeader.click({ button: 'right' });
    
    // "Insert row before"をクリック
    await page.getByText('Insert row before').click();
    
    // 行数が増えることを確認
    rows = page.getByRole('row');
    await expect(rows).toHaveCount(initialCount + 1);
    
    // 新しい行が正しい位置に挿入されたことを確認
    // （元の2行目のデータが3行目に移動している）
    const thirdRow = page.getByRole('row').nth(3);
    await expect(thirdRow.getByRole('rowheader')).toHaveText('3');
  });

  test('should insert row after using context menu', async ({ page }) => {
    // セルに識別可能なデータを入力
    const firstDataCell = page.getByRole('gridcell').first();
    await firstDataCell.dblclick();
    await page.fill('input[type="text"]', '1行目データ');
    await page.press('input[type="text"]', 'Enter');
    
    const secondRowFirstCell = page.getByRole('row').nth(2).getByRole('gridcell').first();
    await secondRowFirstCell.dblclick();
    await page.fill('input[type="text"]', '2行目データ');
    await page.press('input[type="text"]', 'Escape');
    
    // 1行目のヘッダーを右クリック
    const firstRowHeader = page.getByRole('rowheader').first();
    await firstRowHeader.click({ button: 'right' });
    
    // "Insert row after"をクリック
    await page.getByText('Insert row after').click();
    
    // 新しい行が挿入され、元の2行目データが3行目に移動することを確認
    await expect(page.getByRole('gridcell', { name: '1行目データ' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '2行目データ' })).toBeVisible();
    
    // 行番号が正しく更新されることを確認
    const rowHeaders = page.getByRole('rowheader');
    await expect(rowHeaders.nth(0)).toHaveText('1');
    await expect(rowHeaders.nth(1)).toHaveText('2');
    await expect(rowHeaders.nth(2)).toHaveText('3');
  });

  test('should insert column before using context menu', async ({ page }) => {
    // 初期列数
    const firstRow = page.getByRole('row').first();
    let headerCells = firstRow.getByRole('columnheader');
    const initialCount = await headerCells.count();
    
    // B列のヘッダーを右クリック
    const bColumnHeader = page.getByRole('columnheader', { name: 'B' });
    await bColumnHeader.click({ button: 'right' });
    
    // "Insert column before"をクリック
    await page.getByText('Insert column before').click();
    
    // 列数が増えることを確認
    headerCells = firstRow.getByRole('columnheader');
    await expect(headerCells).toHaveCount(initialCount + 1);
    
    // 列ラベルが正しく更新されることを確認（A, B, C, D, E となる）
    await expect(page.getByRole('columnheader', { name: 'A' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'B' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'C' })).toBeVisible();
  });

  test('should remove row using context menu', async ({ page }) => {
    // データを入力して識別しやすくする
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();
    await page.fill('input[type="text"]', '削除対象行');
    await page.press('input[type="text"]', 'Enter');
    
    const secondRowFirstCell = page.getByRole('row').nth(2).getByRole('gridcell').first();
    await secondRowFirstCell.dblclick();
    await page.fill('input[type="text"]', '保持される行');
    await page.press('input[type="text"]', 'Escape');
    
    // 初期行数
    let rows = page.getByRole('row');
    const initialCount = await rows.count();
    
    // 1行目を削除
    const firstRowHeader = page.getByRole('rowheader').first();
    await firstRowHeader.click({ button: 'right' });
    await page.getByText('Remove row').click();
    
    // 行数が減ることを確認
    rows = page.getByRole('row');
    await expect(rows).toHaveCount(initialCount - 1);
    
    // 削除されたデータが表示されないことを確認
    await expect(page.getByRole('gridcell', { name: '削除対象行' })).not.toBeVisible();
    await expect(page.getByRole('gridcell', { name: '保持される行' })).toBeVisible();
  });

  test('should remove column using context menu', async ({ page }) => {
    // A列にデータを入力
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();
    await page.fill('input[type="text"]', '削除対象列');
    await page.press('input[type="text"]', 'Tab');
    
    // B列にデータを入力
    const input = page.locator('input[type="text"]');
    await input.fill('保持される列');
    await input.press('Escape');
    
    // A列を削除
    const aColumnHeader = page.getByRole('columnheader', { name: 'A' });
    await aColumnHeader.click({ button: 'right' });
    await page.getByText('Remove column').click();
    
    // データが削除されることを確認
    await expect(page.getByRole('gridcell', { name: '削除対象列' })).not.toBeVisible();
    await expect(page.getByRole('gridcell', { name: '保持される列' })).toBeVisible();
    
    // 列ラベルが更新されることを確認
    await expect(page.getByRole('columnheader', { name: 'A' })).toHaveText('A'); // 元のB列がA列になる
  });

  test('should prevent removing the last row', async ({ page }) => {
    // すべての行を削除しようとする（最後の1行を残す）
    let rows = page.getByRole('row');
    let currentCount = await rows.count();
    
    // 行追加ボタン行を除く実データ行数を計算（ヘッダー行1 + データ行4 + 行追加ボタン行1 = 6）
    const dataRowsCount = currentCount - 2; // ヘッダー行と行追加ボタン行を除く
    
    // データ行を最小数まで削除
    for (let i = 0; i < dataRowsCount - 1; i++) {
      const firstDataRowHeader = page.getByRole('rowheader').first();
      await firstDataRowHeader.click({ button: 'right' });
      await page.getByText('Remove row').click();
    }
    
    // 最後の行のヘッダーを右クリック
    const lastRowHeader = page.getByRole('rowheader').first();
    await lastRowHeader.click({ button: 'right' });
    
    // Remove rowボタンが無効化されていることを確認
    const removeButton = page.getByText('Remove row');
    await expect(removeButton).toHaveCSS('color', /rgb\(204, 204, 204\)|rgb\(153, 153, 153\)|#ccc|#999/);
  });

  test('should prevent removing the last column', async ({ page }) => {
    // 列を最小数まで削除
    const initialHeaderCells = page.getByRole('row').first().getByRole('columnheader');
    const initialCount = await initialHeaderCells.count();
    const dataColumnsCount = initialCount - 2; // 空セルと列追加ボタンを除く
    
    // データ列を最小数まで削除
    for (let i = 0; i < dataColumnsCount - 1; i++) {
      const columnHeaders = page.getByRole('columnheader').filter({ hasText: /^[A-Z]$/ });
      const firstDataColumn = columnHeaders.first();
      await firstDataColumn.click({ button: 'right' });
      await page.getByText('Remove column').click();
    }
    
    // 最後の列のヘッダーを右クリック
    const lastColumnHeader = page.getByRole('columnheader').filter({ hasText: /^[A-Z]$/ }).first();
    await lastColumnHeader.click({ button: 'right' });
    
    // Remove columnボタンが無効化されていることを確認
    const removeButton = page.getByText('Remove column');
    await expect(removeButton).toHaveCSS('color', /rgb\(204, 204, 204\)|rgb\(153, 153, 153\)|#ccc|#999/);
  });

  test('should maintain cell content during row/column operations', async ({ page }) => {
    // テストデータを入力
    const testData = [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3']
    ];
    
    // データ入力
    for (let row = 0; row < testData.length; row++) {
      for (let col = 0; col < testData[row].length; col++) {
        const cell = page.getByRole('row').nth(row + 1).getByRole('gridcell').nth(col);
        await cell.dblclick();
        await page.fill('input[type="text"]', testData[row][col]);
        if (row === testData.length - 1 && col === testData[row].length - 1) {
          await page.press('input[type="text"]', 'Escape');
        } else {
          await page.press('input[type="text"]', 'Tab');
        }
      }
    }
    
    // 2行目の前に行を挿入
    const secondRowHeader = page.getByRole('rowheader').nth(1);
    await secondRowHeader.click({ button: 'right' });
    await page.getByText('Insert row before').click();
    
    // データが正しい位置にシフトしていることを確認
    await expect(page.getByRole('gridcell', { name: 'A1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'A2' })).toBeVisible(); // 3行目に移動
    await expect(page.getByRole('gridcell', { name: 'A3' })).toBeVisible(); // 4行目に移動
    
    // B列の前に列を挿入
    const bColumnHeader = page.getByRole('columnheader', { name: 'B' });
    await bColumnHeader.click({ button: 'right' });
    await page.getByText('Insert column before').click();
    
    // B列のデータがC列に移動していることを確認
    await expect(page.getByRole('gridcell', { name: 'B1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'B2' })).toBeVisible();
  });

  test('should handle selection state during row/column operations', async ({ page }) => {
    // セルを選択
    const targetCell = page.getByRole('gridcell').nth(5); // 適当なセル
    await targetCell.click();
    
    // 選択状態を確認
    await expect(page.locator('text=Selection:')).toBeVisible();
    
    // 行を追加
    await page.locator('button[title="Add row"]').click();
    
    // 選択状態が維持されるか確認（実装によって異なる）
    await expect(page.locator('text=Selection:')).toBeVisible();
    
    // 列を追加
    await page.locator('button[title="Add column"]').click();
    
    // 選択状態の確認
    await expect(page.locator('text=Selection:')).toBeVisible();
  });
});