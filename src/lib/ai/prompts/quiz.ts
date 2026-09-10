import type { QuizInput } from '../provider'

export function QUIZ_PROMPT(input: QuizInput): string {
  const typeInstructions = input.questionTypes.map((t) => {
    switch (t) {
      case 'mcq': return 'MCQ: question with exactly 4 options, one correct'
      case 'true_false': return 'True/False: statement that is either true or false'
      case 'fill_blank': return 'Fill in the blank: sentence with ___ for missing word/phrase'
      case 'short_answer': return 'Short answer: requires a brief written response (options: null)'
    }
  }).join('; ')

  return `You are StudySnap AI, an expert educational quiz generator. Create ${input.questionCount} questions from the provided study material.

Language: ${input.language}
Difficulty: ${input.difficulty}
Subject: ${input.subject ?? 'General'}
Question types to include: ${typeInstructions}

CRITICAL RULES:
1. Every question MUST be directly based on the provided study material.
2. Do NOT create questions about topics not in the material.
3. MCQ options must be plausible — not obviously wrong.
4. Explanations must educate, not just state the answer.
5. Return ONLY valid JSON. No markdown, no preamble.
6. Distribute questions evenly across different topics in the material.
7. For fill_blank: the answer is only the missing word/phrase.
8. For short_answer: options must be null (not an empty array).

Return this exact JSON:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"] or null for short_answer,
      "correct_answer": "exact answer string",
      "explanation": "why this is correct and educational context",
      "difficulty": "${input.difficulty}",
      "topic": "specific topic from material",
      "question_type": "mcq|true_false|fill_blank|short_answer"
    }
  ]
}

Generate exactly ${input.questionCount} questions. Vary topics across the material.`
}
