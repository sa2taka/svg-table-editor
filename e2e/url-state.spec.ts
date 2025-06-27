import { test, expect } from '@playwright/test';

test.describe('URL State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();
  });

  test('should persist table state in URL after modifications', async ({ page }) => {
    // 初期URLを確認（state パラメータなし）
    const initialUrl = page.url();
    expect(initialUrl).not.toContain('state=');

    // セルを編集
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.dblclick();
    await page.fill('input[type="text"]', 'テスト状態データ');
    await page.press('input[type="text"]', 'Tab');

    // 別のセルも編集
    const input = page.locator('input[type="text"]');
    await input.fill('2番目のセル');
    await input.press('Enter');

    // デバウンス時間（1秒）を待機
    await page.waitForTimeout(1200);

    // URLに状態が保存されることを確認
    const urlWithState = page.url();
    expect(urlWithState).toContain('state=');
    expect(urlWithState).toMatch(/state=[A-Za-z0-9+/=]+/); // Base64またはLZ-String形式

    // URLから状態部分を抽出
    const stateParam = new URL(urlWithState).searchParams.get('state');
    expect(stateParam).toBeTruthy();
    console.log('State parameter length:', stateParam?.length);
  });

  test('should restore table state from URL on page reload', async ({ page }) => {
    // テーブルを編集
    await page.getByRole('gridcell').first().dblclick();
    await page.fill('input[type="text"]', '永続化テストデータ');
    await page.press('input[type="text"]', 'Tab');

    const secondInput = page.locator('input[type="text"]');
    await secondInput.fill('復元確認用データ');
    await secondInput.press('Escape');

    // 行を追加
    await page.getByRole('button', { name: 'Add row', exact: true }).click();
    
    // デバウンス待機
    await page.waitForTimeout(1200);
    
    const stateUrl = page.url();
    expect(stateUrl).toContain('state=');

    // ページをリロード
    await page.reload();
    
    // 状態が復元されることを確認
    await expect(page.getByRole('gridcell', { name: '永続化テストデータ' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '復元確認用データ' })).toBeVisible();
    
    // 行数も復元されることを確認（6行→7行）
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(7);
  });

  test('should handle URL state navigation (back/forward)', async ({ page }) => {
    // 初期状態でのURL
    const initialUrl = page.url();
    
    // 1回目の編集
    await page.getByRole('gridcell').first().dblclick();
    await page.fill('input[type="text"]', '状態1');
    await page.press('input[type="text"]', 'Escape');
    await page.waitForTimeout(1200);
    
    const state1Url = page.url();
    
    // 2回目の編集
    await page.getByRole('gridcell').nth(1).dblclick();
    await page.fill('input[type="text"]', '状態2');
    await page.press('input[type="text"]', 'Escape');
    await page.waitForTimeout(1200);
    
    const state2Url = page.url();
    
    // URL が更新されていることを確認
    expect(state1Url).not.toBe(initialUrl);
    expect(state2Url).not.toBe(state1Url);
    
    // ブラウザの戻るボタン
    await page.goBack();
    await expect(page.getByRole('gridcell', { name: '状態1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '状態2' })).not.toBeVisible();
    
    // ブラウザの進むボタン
    await page.goForward();
    await expect(page.getByRole('gridcell', { name: '状態1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '状態2' })).toBeVisible();
  });

  test('should clear URL state when requested', async ({ page }) => {
    // テーブルを編集して状態を作成
    await page.getByRole('gridcell').first().dblclick();
    await page.fill('input[type="text"]', 'クリア前のデータ');
    await page.press('input[type="text"]', 'Escape');
    await page.waitForTimeout(1200);
    
    // URLに状態が保存されていることを確認
    expect(page.url()).toContain('state=');
    
    // Clear URL ボタンをクリック
    await page.getByRole('button', { name: /clear/i }).click();
    
    // 確認ダイアログを承諾
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Clear URL state');
      dialog.accept();
    });
    
    // URLから状態が削除されることを確認
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('state=');
    
    // テーブルの内容は保持されることを確認
    await expect(page.getByRole('gridcell', { name: 'クリア前のデータ' })).toBeVisible();
  });

  test('should handle malformed URL state gracefully', async ({ page }) => {
    // 不正な状態パラメータでアクセス
    await page.goto('/?state=invalid-base64-data-123');
    
    // エラーが発生せず、デフォルト状態でロードされることを確認
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'Cell (1,1)' })).toBeVisible();
    
    // 行数がデフォルト（6行）であることを確認
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(6);
  });

  test('should compress large table states effectively', async ({ page }) => {
    // 大きなテーブルを作成
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Add row', exact: true }).click();
      await page.getByRole('button', { name: 'Add column', exact: true }).click();
    }
    
    // 多くのセルにデータを入力
    const cells = page.getByRole('gridcell');
    const cellCount = await cells.count();
    
    for (let i = 0; i < Math.min(10, cellCount); i++) {
      const cell = cells.nth(i);
      await cell.dblclick();
      await page.fill('input[type="text"]', `Large data content ${i} with more text to test compression efficiency`);
      await page.press('input[type="text"]', 'Tab');
    }
    
    // 最後の入力を終了
    await page.press('input[type="text"]', 'Escape');
    await page.waitForTimeout(1200);
    
    // URL長が合理的な範囲内であることを確認（圧縮効果）
    const compressedUrl = page.url();
    const stateParam = new URL(compressedUrl).searchParams.get('state');
    
    expect(stateParam).toBeTruthy();
    expect(stateParam!.length).toBeLessThan(2000); // 実用的なURL長制限内
    
    console.log('Compressed state length:', stateParam!.length);
    
    // 状態復元の確認
    await page.reload();
    await expect(page.getByRole('gridcell', { name: /Large data content 0/ })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: /Large data content 5/ })).toBeVisible();
  });

  test('should handle selection state persistence', async ({ page }) => {
    // セルを選択
    const firstCell = page.getByRole('gridcell').first();
    await firstCell.click();
    
    // 選択状態の確認
    await expect(page.locator('text=Selection:')).toBeVisible();
    await expect(page.locator('text=(0, 0) to (0, 0)')).toBeVisible();
    
    // デバウンス待機
    await page.waitForTimeout(1200);
    
    const urlWithSelection = page.url();
    expect(urlWithSelection).toContain('state=');
    
    // 別のセルを選択
    const secondCell = page.getByRole('gridcell').nth(1);
    await secondCell.click();
    
    await expect(page.locator('text=(0, 1) to (0, 1)')).toBeVisible();
    await page.waitForTimeout(1200);
    
    // ページリロード
    await page.reload();
    
    // 選択状態が復元されることを確認
    await expect(page.locator('text=Selection:')).toBeVisible();
    await expect(page.locator('text=(0, 1) to (0, 1)')).toBeVisible();
  });
});