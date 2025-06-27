import { test, expect } from '@playwright/test';

test.describe('SVG Table Editor - Basic E2E', () => {
  test('should load the application and display initial table', async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('/');

    // ページタイトルが正しいことを確認
    await expect(page).toHaveTitle(/SVG Table Editor/);

    // メインヘッダーが表示されていることを確認
    await expect(page.getByRole('heading', { name: 'SVG Table Editor' })).toBeVisible();

    // 初期テーブルが正しく表示されていることを確認
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // 初期状態で6行（ヘッダー + 4データ行 + 行追加ボタン行）があることを確認
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(6);

    // 初期テキスト「Cell (1,1)」が表示されていることを確認
    await expect(page.getByRole('gridcell', { name: 'Cell (1,1)' })).toBeVisible();

    // ツールバーが表示されていることを確認
    await expect(page.getByText('Format')).toBeVisible();
    await expect(page.getByText('Colors')).toBeVisible();
    await expect(page.getByRole('button', { name: '📥 Export' })).toBeVisible();
  });
});