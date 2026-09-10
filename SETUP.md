# StudySnap AI — Setup Guide

Complete setup from zero to running in ~15 minutes.

---

## Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A free [Groq](https://console.groq.com) account
- Git

---

## Step 1 — Clone & Install

```bash
git clone <your-repo-url>
cd studysnap
npm install
```

---

## Step 2 — Supabase Setup

### 2a. Create a project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Choose a name, database password, and region (choose nearest to your users)

### 2b. Run the migrations
1. Go to **SQL Editor** in your project
2. Click **New query**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
4. Repeat for `supabase/migrations/002_helpers.sql`
5. Repeat for `supabase/migrations/003_search.sql`

### 2c. Create the documents storage bucket
1. Go to **Storage** → **New bucket**
2. Name: `documents`
3. Set **Public** to **OFF** (private)
4. Set **File size limit**: `31457280` (30 MB)
5. Set **Allowed MIME types**: `application/pdf,image/png,image/jpeg,image/webp,text/plain`
6. Click **Create bucket**

### 2d. Add storage RLS policies
Go to **Storage** → **Policies** → select `documents` bucket → **New policy**:

**INSERT (Upload)**
```sql
(bucket_id = 'documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

**SELECT (Read)**
```sql
(bucket_id = 'documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

**DELETE**
```sql
(bucket_id = 'documents') AND (auth.uid()::text = (storage.foldername(name))[1])
```

### 2e. Enable Google OAuth (optional but recommended)
1. Go to **Authentication** → **Providers** → **Google**
2. Enable it
3. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Add the Client ID and Secret to Supabase

### 2f. Get your Supabase keys
Go to **Settings** → **API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**keep secret**)

---

## Step 3 — Groq API Key

1. Sign up at [console.groq.com](https://console.groq.com) (free tier — no credit card)
2. Go to **API Keys** → **Create API Key**
3. Copy the key → `GROQ_API_KEY_1`

The free tier includes:
- `llama-3.3-70b-versatile` — used for all AI features
- `nomic-embed-text-v1_5` — used for RAG embeddings
- ~30 requests/minute on the free tier

---

## Step 4 — Environment Variables

Copy the template:
```bash
cp .env.example .env.local
```

Fill in your values:
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY_1=gsk_...

# Required for cron jobs
CRON_SECRET=generate-a-long-random-string-here

# Optional — multiple Groq keys for fallback
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...

# Optional — email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=StudySnap AI <your@gmail.com>

# Optional — admin dashboard
ADMIN_EMAILS=your@email.com

# App URL (for email links)
APP_URL=http://localhost:3000
```

**Generating CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Sign up with your email. Check your inbox for the confirmation link.

---

## Step 6 — Deploy to Vercel

### 6a. Push to GitHub
```bash
git add .
git commit -m "Initial StudySnap AI setup"
git push
```

### 6b. Import in Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Framework Preset** to `Next.js` (auto-detected)

### 6c. Add environment variables
In Vercel project settings → **Environment Variables**, add all variables from your `.env.local`.

Set `APP_URL` to your Vercel deployment URL (e.g. `https://studysnap.vercel.app`).

### 6d. Enable cron jobs
In `vercel.json`, replace `REPLACE_WITH_YOUR_CRON_SECRET` with your actual `CRON_SECRET` value:

```json
{
  "crons": [
    { "path": "/api/cron/reminders?secret=your-actual-secret", "schedule": "0 8 * * *" },
    { "path": "/api/cron/streaks?secret=your-actual-secret", "schedule": "0 1 * * *" },
    { "path": "/api/cron/cleanup?secret=your-actual-secret", "schedule": "0 2 * * 0" }
  ]
}
```

> ⚠️ Do **not** commit your actual secret in `vercel.json`. Use Vercel's environment variable substitution or set the secret in the Vercel dashboard.

### 6e. Update Supabase redirect URLs
In Supabase **Authentication** → **URL Configuration**:
- **Site URL**: `https://your-vercel-url.vercel.app`
- **Redirect URLs**: `https://your-vercel-url.vercel.app/**`

---

## Step 7 — Configure Admin Access

Add your email to the `ADMIN_EMAILS` environment variable (comma-separated for multiple admins):

```env
ADMIN_EMAILS=admin@yourdomain.com,other@yourdomain.com
```

Access the admin dashboard at `/admin`.

---

## Gmail SMTP Setup (for email notifications)

1. Enable 2FA on your Google account
2. Go to **Google Account** → **Security** → **App passwords**
3. Create an app password for "Mail"
4. Use that 16-character password as `SMTP_PASSWORD`

---

## Commands Reference

```bash
npm run dev          # Start development server
npm run build        # Production build (test before deploying)
npm run test         # Unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:e2e     # E2E tests (requires running server)
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
```

---

## Troubleshooting

**"Missing Supabase admin credentials"**
→ Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

**"No Groq API keys configured"**
→ Add `GROQ_API_KEY_1` in `.env.local`

**PDF extraction fails**
→ The PDF may be password-protected or image-only. Try converting to PNG first.

**OCR not working**
→ Make sure the image is clear and well-lit. Tesseract works best on printed text.

**Google OAuth redirect error**
→ Check that the redirect URI in Google Console matches your Supabase URL exactly.

**Storage upload 403**
→ Make sure the storage bucket RLS policies are set correctly (Step 2d).

---

## Architecture Overview

```
User → Next.js App (Vercel)
         ↓
   Supabase Auth ← Google OAuth
         ↓
   Supabase DB (PostgreSQL + pgvector)
         ↓
   Supabase Storage (private documents bucket)
         ↓
   Groq API (AI: llama-3.3-70b-versatile + nomic-embed-text)
```

All AI calls are server-side only. API keys never reach the browser.
