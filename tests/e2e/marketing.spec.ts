import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

test.describe('Marketing page', () => {
  test('hero section is visible', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByText('Study smarter')).toBeVisible()
    await expect(page.getByText('Not harder')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Studying Free' })).toBeVisible()
  })

  test('how it works section', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByText('How StudySnap works')).toBeVisible()
    await expect(page.getByText('Upload Notes')).toBeVisible()
    await expect(page.getByText('AI Understands')).toBeVisible()
  })

  test('features section', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByText('AI Summaries')).toBeVisible()
    await expect(page.getByText('Smart Quizzes')).toBeVisible()
    await expect(page.getByText('AI Tutor')).toBeVisible()
  })

  test('CTA links to signup', async ({ page }) => {
    await page.goto(BASE)
    const cta = page.getByRole('link', { name: 'Start Studying Free' })
    await expect(cta).toHaveAttribute('href', '/signup')
  })

  test('navigation bar has sign in link', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })
})
