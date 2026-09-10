import type { StudyPlanInput } from '../provider'

export function PLANNER_PROMPT(input: StudyPlanInput): string {
  const today = new Date()
  const examDate = new Date(input.examDate)
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return `You are StudySnap AI, an expert study planner. Create a realistic, day-by-day study plan.

Subject: ${input.subject}
Units/Topics: ${input.units.join(', ')}
Exam date: ${input.examDate}
Days until exam: ${daysUntilExam}
Daily available time: ${input.dailyMinutes} minutes
Current knowledge level: ${input.currentLevel}

PLANNER RULES:
1. Create tasks for EVERY day from tomorrow until 1 day before exam.
2. Distribute topics proportionally based on complexity and days available.
3. Include mix of: study sessions, quizzes, flashcard reviews, and revision.
4. Leave the day before exam for light revision only.
5. Earlier days: new content. Later days: revision and practice.
6. Each task should fit within ${input.dailyMinutes} minutes total per day.
7. Date format: YYYY-MM-DD starting from ${new Date(today.getTime() + 86400000).toISOString().split('T')[0]}.
8. Return ONLY valid JSON. No markdown, no preamble.

Return this exact JSON:
{
  "strategy": "Brief description of the study strategy",
  "tasks": [
    {
      "title": "Task title",
      "description": "What to study/do in this session",
      "task_type": "study|quiz|flashcards|revision",
      "scheduled_date": "YYYY-MM-DD",
      "duration_minutes": <number>
    }
  ]
}

Important: Only generate tasks if daysUntilExam > 0. Max tasks per day = 3.`
}
