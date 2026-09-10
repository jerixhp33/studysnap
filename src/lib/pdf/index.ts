export interface PDFExtractionResult {
  text: string
  pageCount: number
  pageTexts: string[]
}

export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require('pdf-parse')
    let text = ''
    let pageCount = 1

    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer, { max: 0 })
      text = data.text || ''
      pageCount = data.numpages || 1
    } else if (pdfModule.PDFParse) {
      const instance = new pdfModule.PDFParse({ data: buffer })
      const data = await instance.getText()
      text = data.text || ''
      pageCount = data.total || 1
    } else if (typeof pdfModule.default === 'function') {
      const data = await pdfModule.default(buffer, { max: 0 })
      text = data.text || ''
      pageCount = data.numpages || 1
    } else {
      throw new Error('Unsupported pdf-parse module structure')
    }

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
