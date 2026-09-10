# StudySnap AI

> Turn your notes into your personal AI study system.

## What is StudySnap AI?

StudySnap AI is a complete AI-powered student learning platform. Upload your notes (PDF, images, text) and get:
- **AI Summaries** — Quick, detailed, or exam-focused
- **Smart Quizzes** — MCQ, True/False, Fill-in-the-blank from your actual notes
- **Flashcards** — Spaced repetition for long-term memory
- **AI Tutor** — Chat with AI grounded in your uploaded material (RAG)
- **Exam Planner** — Day-by-day AI study plans
- **Progress Tracking** — Weak topic detection, streaks, analytics

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers, Server Actions |
| Database | Supabase PostgreSQL + pgvector |
| Auth | Supabase Auth (Google OAuth + Email) |
| AI | Groq API (llama-3.3-70b-versatile) |
| Storage | Supabase Storage |
| PDF | pdf-parse |
| Email | Nodemailer (SMTP) |

## Quick Start

### 1. Clone & Install
```bash
git clone <repo>
cd studysnap
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Fill in your credentials
```

### 3. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run the contents of `supabase/migrations/001_initial_schema.sql`
3. Enable Google OAuth in Authentication → Providers
4. Create a `documents` storage bucket (set to private)

### 4. Get a Groq API Key
1. Sign up at [console.groq.com](https://console.groq.com) (free tier available)
2. Create an API key and add to `GROQ_API_KEY_1`

### 5. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `GROQ_API_KEY_1` | ✅ | Groq API key (primary) |
| `GROQ_API_KEY_2` | ⬜ | Groq API key (fallback) |
| `GROQ_API_KEY_3` | ⬜ | Groq API key (fallback) |
| `CRON_SECRET` | ✅ | Secret for cron endpoints |
| `SMTP_HOST` | ⬜ | Email SMTP host |
| `SMTP_PORT` | ⬜ | Email SMTP port |
| `SMTP_USER` | ⬜ | Email SMTP username |
| `SMTP_PASSWORD` | ⬜ | Email SMTP password |
| `ADMIN_EMAILS` | ⬜ | Comma-separated admin email addresses |
| `APP_URL` | ⬜ | Public app URL (for emails) |

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # Lint
npm test          # Unit tests (Vitest)
```

## Cron Jobs (Vercel)

Add these to `vercel.json` for scheduled tasks:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 8 * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 2 * * 0" }
  ]
}
```

Protect with: `x-cron-secret: YOUR_CRON_SECRET` header or `?secret=` query param.

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, signup, forgot password
│   ├── (marketing)/        # Landing page
│   ├── dashboard/          # All dashboard pages
│   └── api/                # API routes
│       ├── ai/             # Summary, quiz, flashcards, tutor, study-plan
│       ├── documents/      # Upload, process
│       ├── flashcards/     # Review endpoint
│       ├── quiz/           # Attempt save
│       ├── sessions/       # Study session tracking
│       ├── notifications/  # Notification read/list
│       └── cron/           # Scheduled jobs
├── components/             # React components
├── lib/
│   ├── ai/                 # AI provider abstraction + Groq implementation
│   ├── rag/                # Retrieval-Augmented Generation (pgvector)
│   ├── pdf/                # PDF text extraction
│   ├── supabase/           # Client, server, admin clients
│   ├── email/              # Nodemailer email templates
│   └── usage/              # Usage limit tracking
├── schemas/                # Zod validation schemas
└── types/                  # TypeScript types
```

## Security

- Row Level Security (RLS) on all tables — users see only their own data
- Service role key never exposed to browser
- AI API keys server-side only
- File type + size validation on upload
- All AI outputs validated with Zod before database insertion
- Cron endpoints protected with `CRON_SECRET`
- Admin routes verified server-side

## Database

See `supabase/migrations/001_initial_schema.sql` for the complete schema with:
- 20 tables, all with RLS policies
- pgvector extension for semantic search
- Automatic profile creation trigger
- Usage increment function
- Vector similarity search function

## Known Limitations (MVP)

1. **OCR for images** — Image documents require client-side Tesseract.js; server-side extraction creates a placeholder
2. **Embeddings** — Requires Groq's `nomic-embed-text-v1_5` model (may not always be available); falls back to keyword search
3. **Email** — Requires SMTP configuration; skips silently if not set
4. **Real-time** — Document processing uses polling (every 2s) rather than websockets
5. **Streak logic** — Simplified; production would need daily job to increment streaks

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel dashboard
3. Add all environment variables
4. Deploy

### Supabase Storage
Create a `documents` bucket with these settings:
- Public: No (private)
- File size limit: 30MB
- Allowed MIME types: `application/pdf, image/*, text/plain`
