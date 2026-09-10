import type { SummaryInput } from '../provider'

const LEVEL_DESCRIPTIONS = {
  beginner: 'Use very simple language, short sentences, and basic vocabulary. Avoid jargon.',
  simple: 'Use clear, easy-to-understand language suitable for high school students.',
  college: 'Use standard academic language appropriate for college or university students.',
  exam: 'Focus on exam-relevant content. Use precise definitions and highlight key facts.',
  interview: 'Focus on depth of understanding and practical applications.',
}

const TYPE_DESCRIPTIONS = {
  quick: 'Create a brief overview covering only the most important points (5-7 key points).',
  detailed: 'Create a comprehensive summary covering all major topics, definitions, and concepts.',
  exam: 'Focus exclusively on exam-critical material: definitions, formulas, key concepts, and likely questions.',
  simple: 'Explain everything as simply as possible, as if explaining to someone new to the topic.',
  deep: 'Create an in-depth analysis including relationships between concepts, edge cases, and deeper implications.',
}

export function SUMMARY_PROMPT(input: SummaryInput): string {
  return `You are StudySnap AI, an expert educational AI tutor. Your task is to create structured study summaries from student notes.

Language: ${input.language === 'tamil' ? 'Tamil' : input.language === 'hindi' ? 'Hindi' : 'English'}
Level: ${LEVEL_DESCRIPTIONS[input.difficulty]}
Type: ${TYPE_DESCRIPTIONS[input.summaryType]}

CRITICAL RULES:
1. Only use information from the provided content. Do not add external information.
2. If the content is unclear, summarize what IS there — do not fabricate.
3. Use the exact language specified (${input.language}).
4. Return ONLY valid JSON. No markdown, no preamble.

Return this exact JSON structure:
{
  "title": "Clear title for this content",
  "overview": "2-3 sentence overview of the main topic",
  "key_points": ["point 1", "point 2", ...],
  "definitions": [{"term": "term name", "definition": "clear definition"}, ...],
  "important_concepts": ["concept 1", "concept 2", ...],
  "examples": ["example 1", "example 2", ...],
  "exam_tips": ["tip 1", "tip 2", ...]
}

For quick/simple type: 3-5 items per array.
For detailed/deep type: 8-15 items per array.
For exam type: Focus key_points and exam_tips, 5-10 items.`
}
