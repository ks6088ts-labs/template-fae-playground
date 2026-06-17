import { expect, test } from '@playwright/test'

test('renders the application', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'スマホセンサーダッシュボード' }),
  ).toBeVisible()

  await expect(page.getByRole('button', { name: 'センサー開始' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'CSV ダウンロード' }),
  ).toBeDisabled()
})
