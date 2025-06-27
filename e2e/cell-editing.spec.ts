import { test, expect } from '@playwright/test';

test.describe('Cell Editing and Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 初期状態確認
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();
  });

  test('should edit cell content with double-click', async ({ page }) => {
    // セルをダブルクリックして編集モードに入る
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();

    // 入力フィールドが表示されることを確認
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // 既存のテキストを確認（初期値："Cell (1,1)"）
    await expect(input).toHaveValue('Cell (1,1)');

    // 新しいテキストを入力
    await input.fill('新しいセル内容');
    await input.press('Enter');

    // 編集モードが終了し、新しい内容が表示されることを確認
    await expect(input).not.toBeVisible();
    await expect(page.getByRole('gridcell', { name: '新しいセル内容' })).toBeVisible();
  });

  test('should navigate cells with keyboard', async ({ page }) => {
    // 最初のセルをダブルクリックして編集開始
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();

    const input = page.locator('input[type="text"]');
    await input.fill('セル1');

    // Enterで下のセルに移動
    await input.press('Enter');
    
    // 少し待ってから入力フィールドを再取得
    await page.waitForTimeout(500);
    const newInput = page.locator('input[type="text"]');
    
    // 下のセルが編集モードになることを確認
    await expect(newInput).toBeVisible();
    await expect(newInput).toBeFocused();
    
    // セル位置確認のため内容を入力
    await newInput.fill('セル2（下）');

    // Tabで右のセルに移動
    await newInput.press('Tab');
    await page.waitForTimeout(300);
    const tabInput = page.locator('input[type="text"]');
    await expect(tabInput).toBeVisible();
    await tabInput.fill('セル3（右）');

    // Shift+Tabで左のセルに移動
    await tabInput.press('Shift+Tab');
    await page.waitForTimeout(300);
    const shiftTabInput = page.locator('input[type="text"]');
    await expect(shiftTabInput).toBeVisible();
    await shiftTabInput.fill('セル4（左）');

    // Shift+Enterで上のセルに移動
    await shiftTabInput.press('Shift+Enter');
    await page.waitForTimeout(300);
    const shiftEnterInput = page.locator('input[type="text"]');
    await expect(shiftEnterInput).toBeVisible();

    // Escapeで編集モードを終了
    await shiftEnterInput.press('Escape');
    await expect(page.locator('input[type="text"]')).not.toBeVisible();

    // 入力内容が保存されていることを確認
    await expect(page.getByRole('gridcell', { name: 'セル1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'セル2（下）' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'セル3（右）' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'セル4（左）' })).toBeVisible();
  });

  test('should handle IME input (Japanese)', async ({ page }) => {
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();

    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();

    // 日本語入力をシミュレート
    await input.fill('こんにちは世界');
    await input.press('Enter');

    // 日本語が正しく保存されることを確認
    await expect(page.getByRole('gridcell', { name: 'こんにちは世界' })).toBeVisible();
  });

  test('should cancel editing with Escape key', async ({ page }) => {
    const firstCell = page.getByRole('gridcell').first();
    const originalText = await firstCell.textContent();
    
    await firstCell.dblclick();
    const input = page.locator('input[type="text"]');
    
    // 内容を変更
    await input.fill('変更されたテキスト');
    
    // Escapeでキャンセル
    await input.press('Escape');
    
    // 編集モードが終了し、元の内容が維持されることを確認
    await expect(input).not.toBeVisible();
    await expect(firstCell).toHaveText(originalText || '');
  });

  test('should handle cell focus with arrow keys', async ({ page }) => {
    // テーブルにフォーカスを当てる
    await page.getByRole('table').focus();
    
    // 最初のセルをクリックして選択
    await page.getByRole('gridcell').first().click();
    
    // 選択状態の視覚的確認（背景色変化）
    const selectedCell = page.getByRole('gridcell').first();
    const bgColor = await selectedCell.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // 透明でないことを確認
    
    // 矢印キーでのナビゲーション
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100); // 選択状態の更新を待つ
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    
    // 最初のセルに戻っていることを確認
    await page.keyboard.press('Enter');
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('should handle cell selection display', async ({ page }) => {
    // セル選択
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.click();
    
    // 選択範囲表示の確認
    const selectionInfo = page.locator('text=Selection:');
    await expect(selectionInfo).toBeVisible();
    await expect(page.locator('text=Single cell')).toBeVisible();
    
    // 座標表示の確認
    await expect(page.locator('text=(0, 0) to (0, 0)')).toBeVisible();
  });
});