export interface PDFExtractionResult {
  text: string
  pageCount: number
  pageTexts: string[]
}

export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    const text = data.text || ''
    const pageCount = data.numpages || 1
    const pageTexts = splitIntoPages(text, pageCount)
    return { text, pageCount, pageTexts }
  } catch (err) {
    const error = err as Error
    console.error('PDF extraction error detail:', error)
    throw new Error(`PDF extraction failed: ${error.message}`)
  }
}

function splitIntoPages(text: string, pageCount: number): string[] {
  if (pageCount <= 1) return [text]
  const avgCharsPerPage = Math.ceil(text.length / pageCount)
  return Array.from({ length: pageCount }, (_, i) =>
    text.slice(i * avgCharsPerPage, Math.min((i + 1) * avgCharsPerPage, text.length))
  )
}

export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s{3,}/g, '\n\n')
    .replace(/\f/g, '\n\n')
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[-_]{5,}/g, '---')
    .trim()
}
