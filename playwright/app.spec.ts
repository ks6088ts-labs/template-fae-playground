import { expect, test } from '@playwright/test'

test('renders the application', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Sensor Host' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible()
  await expect(page.getByText('状態:')).toBeVisible()

  const counter = page.getByRole('button', { name: 'Count is 0' })
  await expect(counter).toBeVisible()
  await counter.click()
  await expect(page.getByRole('button', { name: 'Count is 1' })).toBeVisible()
})

test('renders sensor role view', async ({ page }) => {
  await page.goto('/?role=sensor')
  await expect(page.getByRole('heading', { name: 'Sensor client' })).toBeVisible()
  await expect(page.getByText('接続先 peer ID がありません。QR から開いてください。')).toBeVisible()
})
