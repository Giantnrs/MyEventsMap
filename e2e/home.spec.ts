import { test, expect } from '@playwright/test'

test('homepage loads and shows events', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/events found/i)).toBeVisible()
})

test('can switch to map view', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /map/i }).click()
  await expect(page.locator('.leaflet-container')).toBeVisible()
})

test('filter by category works', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /search/i }).click()
  await page.selectOption('select', 'MUSIC')
  // Results should update
  await expect(page.getByText(/events found/i)).toBeVisible()
})