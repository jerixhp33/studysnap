/**
 * E2E tests for dashboard flows.
 * Requires a running server and test credentials in environment.
 *
 * Set these env vars to run authenticated tests:
 *   TEST_EMAIL=test@example.com
 *   TEST_PASSWORD=testpassword123
 *   BASE_URL=http://localhost:3000
 */
import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? ''
const hasCredentials = !!(TEST_EMAIL && TEST_PASSWORD)

// Helper: log in
async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 })
}

// Unauthenticated tests — always run
test.describe('Public routes', () => {
  test('home page renders correctly', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/StudySnap/)
    await expect(page.getByRole('link', { name: /Start Studying/i })).toBeVisible()
  })

  test('login page has correct form elements', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText('Continue with Google')).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await expect(page.getByRole('heading', { name: /Start studying/i })).toBeVisible()
    await expect(page.locator('input[name]').first()).toBeVisible()
  })

  test('unauthenticated /dashboard redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('404 page shows helpful message', async ({ page }) => {
    await page.goto(`${BASE}/this-does-not-exist`)
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible()
  })
})

// Authenticated tests — only run when credentials provided
test.describe('Authenticated dashboard', () => {
  test.skip(!hasCredentials, 'Set TEST_EMAIL and TEST_PASSWORD to run authenticated tests')

  test('can log in and reach dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(`${BASE}/dashboard`)
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible()
  })

  test('dashboard shows quick action buttons', async ({ page }) => {
    await login(page)
    await expect(page.getByText('Upload Notes')).toBeVisible()
    await expect(page.getByText('Start Quiz')).toBeVisible()
    await expect(page.getByText('Flashcards')).toBeVisible()
    await expect(page.getByText('Ask AI Tutor')).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    await login(page)
    // Navigate to subjects
    await page.click('a[href="/dashboard/subjects"]')
    await expect(page).toHaveURL(`${BASE}/dashboard/subjects`)
    // Navigate to notes
    await page.click('a[href="/dashboard/notes"]')
    await expect(page).toHaveURL(`${BASE}/dashboard/notes`)
  })

  test('subjects page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/subjects`)
    // Either shows subjects or empty state
    await expect(
      page.getByText('Subjects').or(page.getByText('No subjects yet'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('notes page loads with upload button', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/notes`)
    await expect(page.getByText('Upload Notes').or(page.getByText('No notes yet'))).toBeVisible({ timeout: 8000 })
  })

  test('quizzes page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/quizzes`)
    await expect(page.getByText('Generate a Quiz')).toBeVisible({ timeout: 8000 })
  })

  test('flashcards page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/flashcards`)
    await expect(page.getByText('Flashcards')).toBeVisible({ timeout: 8000 })
  })

  test('AI tutor page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/tutor`)
    await expect(page.getByText('AI Tutor')).toBeVisible({ timeout: 8000 })
    await expect(page.getByPlaceholder(/Ask a question/i)).toBeVisible()
  })

  test('progress page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/progress`)
    await expect(page.getByText('Progress')).toBeVisible({ timeout: 8000 })
  })

  test('settings page loads with profile form', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/settings`)
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Save Changes')).toBeVisible()
  })

  test('evaluator page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/evaluate`)
    await expect(page.getByText('Answer Evaluator')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Evaluate My Answer')).toBeVisible()
  })

  test('notifications page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/notifications`)
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 8000 })
  })

  test('exam planner page loads', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/dashboard/exams`)
    await expect(page.getByText('Exam Planner')).toBeVisible({ timeout: 8000 })
  })

  test('search bar is present in header', async ({ page }) => {
    await login(page)
    await expect(page.getByPlaceholder(/Search notes/i)).toBeVisible({ timeout: 5000 })
  })
})
