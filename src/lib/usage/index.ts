import { createAdminClient } from '@/lib/supabase/admin'

// ─── Default limits per tier ──────────────────────────────────────────────────

const DEFAULT_LIMITS: Record<string, Record<string, number>> = {
  free: {
    documents_per_month: 5,
    ai_generations_per_month: 100,
    quiz_generations_per_month: 20,
    flashcard_generations_per_month: 30,
    tutor_questions_per_day: 20,
  },
  pro: {
    documents_per_month: 50,
    ai_generations_per_month: 1000,
    quiz_generations_per_month: 200,
    flashcard_generations_per_month: 300,
    tutor_questions_per_day: 200,
  },
  college: {
    documents_per_month: 200,
    ai_generations_per_month: 5000,
    quiz_generations_per_month: 1000,
    flashcard_generations_per_month: 1500,
    tutor_questions_per_day: 1000,
  },
}

export interface UsageCheckResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  reset_at: string
}

export async function checkUsageLimit(
  userId: string,
  feature: string
): Promise<UsageCheckResult> {
  const admin = createAdminClient()

  // Get user's tier
  const { data: sub } = await admin
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle()

  const tier = sub?.tier ?? 'free'
  const limit = DEFAULT_LIMITS[tier]?.[feature] ?? 100

  // Determine period
  const isPeriodDaily = feature.includes('per_day')
  const now = new Date()
  const period = isPeriodDaily
    ? now.toISOString().split('T')[0] // YYYY-MM-DD
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // YYYY-MM

  const resetAt = isPeriodDaily
    ? new Date(now.getTime() + 86400000).toISOString()
    : new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  // Get or create usage record
  const { data: usage } = await admin
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', period)
    .maybeSingle()

  const current = usage?.count ?? 0

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    reset_at: resetAt,
  }
}

export async function incrementUsage(
  userId: string,
  feature: string
): Promise<void> {
  const admin = createAdminClient()

  const isPeriodDaily = feature.includes('per_day')
  const now = new Date()
  const period = isPeriodDaily
    ? now.toISOString().split('T')[0]
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const resetAt = isPeriodDaily
    ? new Date(now.getTime() + 86400000).toISOString()
    : new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  // Upsert usage record
  await admin.from('usage_limits').upsert(
    {
      user_id: userId,
      feature,
      period,
      count: 1,
      reset_at: resetAt,
    },
    {
      onConflict: 'user_id,feature,period',
      ignoreDuplicates: false,
    }
  )

  // Increment count
  await admin.rpc('increment_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_period: period,
  })
}

export function usageLimitResponse(result: UsageCheckResult): Response {
  return Response.json(
    {
      error: `Usage limit reached. You have used ${result.current}/${result.limit} ${result.remaining === 0 ? '(limit reached)' : ''}. Resets at ${result.reset_at}.`,
      code: 'USAGE_LIMIT_EXCEEDED',
      data: result,
    },
    { status: 429 }
  )
}
