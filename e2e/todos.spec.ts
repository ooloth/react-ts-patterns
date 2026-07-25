import { expect, test } from '@playwright/test'

// Enforce fast delay for every test regardless of the app's current default,
// so a future default change doesn't silently slow the suite down.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Instant (300ms)' }).click()
})

test('page loads with seed todos', async ({ page }) => {
  await expect(page.getByText('Read the React 19 docs')).toBeVisible()
  await expect(page.getByText('Build this todo app')).toBeVisible()
  await expect(page.getByText('Review TypeScript utility types')).toBeVisible()
})

test('add button: disabled when input is empty', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled()
})

test('add button: disabled for whitespace-only input', async ({ page }) => {
  await page.getByPlaceholder('New todo…').fill('   ')
  await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled()
})

test('add button: enabled when input has text', async ({ page }) => {
  await page.getByPlaceholder('New todo…').fill('Write Playwright tests')
  await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled()
})

test('add: input clears immediately on submit', async ({ page }) => {
  const input = page.getByPlaceholder('New todo…')
  await input.fill('Write Playwright tests')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(input).toHaveValue('')
})

test('add: new todo appears immediately and persists', async ({ page }) => {
  await page.getByPlaceholder('New todo…').fill('Write Playwright tests')
  await page.getByRole('button', { name: 'Add' }).click()

  // Optimistic — visible before the server call resolves
  await expect(page.getByText('Write Playwright tests')).toBeVisible()

  // Persists after the server round-trip completes
  await page.waitForTimeout(400)
  await expect(page.getByText('Write Playwright tests')).toBeVisible()
})

test('toggle: strikethrough appears immediately and persists', async ({ page }) => {
  const row = page.getByRole('listitem').filter({ hasText: 'Read the React 19 docs' })
  await row.getByRole('checkbox').click()

  // Optimistic — line-through class applied before server responds
  await expect(row.getByText('Read the React 19 docs')).toHaveClass(/line-through/)

  // Persists after the server round-trip completes
  await page.waitForTimeout(400)
  await expect(row.getByText('Read the React 19 docs')).toHaveClass(/line-through/)
})

test('delete: item disappears immediately and does not return', async ({ page }) => {
  const item = page.getByText('Build this todo app')
  await item.locator('..').getByRole('button', { name: 'Delete' }).click()

  // Optimistic — gone before server responds
  await expect(item).not.toBeVisible()

  // Stays gone after server round-trip
  await page.waitForTimeout(400)
  await expect(item).not.toBeVisible()
})

test('fail-next: optimistic update rolls back on server error', async ({ page }) => {
  await page.getByLabel('Fail next request').check()

  const row = page.getByRole('listitem').filter({ hasText: 'Read the React 19 docs' })
  await row.getByRole('checkbox').click()

  // Optimistic update applies immediately
  await expect(row.getByText('Read the React 19 docs')).toHaveClass(/line-through/)

  // After the simulated failure, the update rolls back
  await expect(row.getByText('Read the React 19 docs')).not.toHaveClass(/line-through/)

  // Error toast confirms the rollback
  await expect(page.getByText('Failed to update — change rolled back')).toBeVisible()
})
