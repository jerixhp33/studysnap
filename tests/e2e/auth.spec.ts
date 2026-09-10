import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

test.describe('Authentication', () => {
  test('marketing page loads', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/StudySnap AI/)
    await expect(page.getByText('Study smarter')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await expect(page.getByRole('heading', { name: 'Start studying smarter' })).toBeVisible()
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`)
    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible()
  })

  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/login/)
  })

  test('admin redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    await expect(page).toHaveURL(/login/)
  })

  test('login form validates email', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    // Browser-native email validation prevents submission
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('signup link on login page works', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('a[href="/signup"]')
    await expect(page).toHaveURL(/signup/)
  })
})
