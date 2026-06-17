import { expect, test } from '@playwright/test'

test('renders the application', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible()

  const counter = page.getByRole('button', { name: 'Count is 0' })
  await expect(counter).toBeVisible()
  await counter.click()
  await expect(page.getByRole('button', { name: 'Count is 1' })).toBeVisible()
})
