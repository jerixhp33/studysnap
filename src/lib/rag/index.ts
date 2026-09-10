import { createAdminClient } from '@/lib/supabase/admin'

// ─── Embedding using Groq (or fallback to simple TF-IDF style) ────────────────

// We use Groq's embedding model if available, otherwise a lightweight approach
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GROQ_API_KEY_1
  if (!apiKey) {
    // Fallback: return empty array (pgvector search will be skipped)
    return []
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text-v1_5',
        input: text.slice(0, 8000),
      }),
    })

    if (!response.ok) {
      console.warn('Embedding API failed, using keyword search fallback')
      return []
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> }
    return data.data[0]?.embedding ?? []
  } catch {
    console.warn('Embedding generation failed, using keyword search fallback')
    return []
  }
}

// ─── Semantic chunking ────────────────────────────────────────────────────────

export function chunkText(
  text: string,
  chunkSize = 800,
  overlap = 100
): string[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // Overlap: keep last sentences
      const sentences = currentChunk.split(/[.!?]+/)
      const overlapText = sentences.slice(-2).join('. ')
      currentChunk = overlapText.length < overlap ? overlapText + ' ' + trimmed : trimmed
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // Fallback: split long paragraphs by sentences
  const result: string[] = []
  for (const chunk of chunks) {
    if (chunk.length > chunkSize * 1.5) {
      const sentences = chunk.split(/(?<=[.!?])\s+/)
      let sub = ''
      for (const s of sentences) {
        if (sub.length + s.length > chunkSize && sub) {
          result.push(sub.trim())
          sub = s
        } else {
          sub += (sub ? ' ' : '') + s
        }
      }
      if (sub) result.push(sub.trim())
    } else {
      result.push(chunk)
    }
  }

  return result.filter((c) => c.length > 20)
}

// ─── Store chunks with embeddings ─────────────────────────────────────────────

export async function storeDocumentChunks(
  documentId: string,
  userId: string,
  chunks: string[],
  pageNumbers?: number[]
): Promise<void> {
  const admin = createAdminClient()

  // Delete existing chunks
  await admin
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId)

  // Cap max chunks to 300 to prevent serverless execution timeout on huge books (25MB+)
  const maxChunks = chunks.slice(0, 300)

  // Process embeddings with concurrency control (batches of 10)
  const chunkData = []
  const concurrencyBatchSize = 10

  for (let i = 0; i < maxChunks.length; i += concurrencyBatchSize) {
    const batch = maxChunks.slice(i, i + concurrencyBatchSize)
    const processedBatch = await Promise.all(
      batch.map(async (content, idx) => {
        const index = i + idx
        let embedding: number[] = []
        try {
          // Generate embeddings for the first 50 chunks for fast search
          if (index < 50) {
            embedding = await generateEmbedding(content)
          }
        } catch {
          embedding = []
        }

        return {
          document_id: documentId,
          user_id: userId,
          content,
          chunk_index: index,
          page_number: pageNumbers?.[index] ?? null,
          embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
          chapter: null,
          topic: null,
        }
      })
    )
    chunkData.push(...processedBatch)
  }

  // Insert in DB in batches of 50
  const dbBatchSize = 50
  for (let i = 0; i < chunkData.length; i += dbBatchSize) {
    const batch = chunkData.slice(i, i + dbBatchSize)
    const { error } = await admin.from('document_chunks').insert(batch)
    if (error) {
      console.error('Error inserting chunks:', error)
      throw new Error(`Failed to store document chunks: ${error.message}`)
    }
  }
}

// ─── Retrieve relevant context ────────────────────────────────────────────────

export async function retrieveRelevantContext(
  query: string,
  userId: string,
  options: {
    documentId?: string
    subjectId?: string
    limit?: number
    threshold?: number
  } = {}
): Promise<Array<{ content: string; page_number: number | null; document_id: string }>> {
  const { documentId, subjectId, limit = 5 } = options
  const admin = createAdminClient()

  const embedding = await generateEmbedding(query)

  if (embedding.length > 0) {
    // Vector similarity search
    try {
      const { data, error } = await admin.rpc('match_document_chunks', {
        query_embedding: JSON.stringify(embedding),
        match_user_id: userId,
        filter_document_id: documentId ?? null,
        match_count: limit,
      })

      if (!error && data && data.length > 0) {
        return data
      }
    } catch {
      // Fall through to keyword search
    }
  }

  // Keyword fallback search
  let queryBuilder = admin
    .from('document_chunks')
    .select('content, page_number, document_id')
    .eq('user_id', userId)
    .textSearch('content', query.split(' ').slice(0, 5).join(' | '), { type: 'websearch' })
    .limit(limit)

  if (documentId) queryBuilder = queryBuilder.eq('document_id', documentId)

  const { data } = await queryBuilder
  return data ?? []
}

// ─── Build context string from chunks ─────────────────────────────────────────

export function buildContext(
  chunks: Array<{ content: string; page_number: number | null }>
): string {
  return chunks
    .map((c, i) =>
      `[Excerpt ${i + 1}${c.page_number ? ` (Page ${c.page_number})` : ''}]\n${c.content}`
    )
    .join('\n\n---\n\n')
}
