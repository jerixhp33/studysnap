import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP not configured — email not sent:', subject)
    return
  }
  const transport = createTransport()
  await transport.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject, html, text })
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to StudySnap AI 🎓',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="color:#6366f1">Welcome to StudySnap AI!</h1>
        <p>Hi ${name},</p>
        <p>You're all set! Start by uploading your notes and let StudySnap AI turn them into summaries, quizzes, flashcards, and personalized study plans.</p>
        <a href="${process.env.APP_URL}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Start Studying →</a>
        <p style="color:#64748b;font-size:14px">Study smarter, not harder.</p>
      </div>
    `,
  }
}

export function studyReminderEmail(name: string, tasks: string[]): { subject: string; html: string } {
  return {
    subject: '📖 Your study tasks for today',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1">Today's Study Plan</h2>
        <p>Hi ${name}, here are your tasks for today:</p>
        <ul>${tasks.map(t => `<li>${t}</li>`).join('')}</ul>
        <a href="${process.env.APP_URL}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open StudySnap →</a>
      </div>
    `,
  }
}

export function examReminderEmail(name: string, examName: string, daysLeft: number): { subject: string; html: string } {
  return {
    subject: `⏰ ${daysLeft} days until your ${examName} exam`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1">Exam Reminder</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${examName}</strong> exam is in <strong>${daysLeft} days</strong>. Make sure you're following your study plan!</p>
        <a href="${process.env.APP_URL}/dashboard/exams" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Study Plan →</a>
      </div>
    `,
  }
}
