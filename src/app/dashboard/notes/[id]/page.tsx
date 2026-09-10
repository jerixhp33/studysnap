import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DocumentViewer } from '@/components/documents/document-viewer'

interface Props { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('documents').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Document' }
}

export default async function DocumentPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: doc } = await supabase
    .from('documents')
    .select('*, subjects:subjects(id,name,color)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!doc) notFound()

  const { data: summaries } = await supabase
    .from('summaries')
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: false })

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user.id)
    .eq('archived', false)

  return (
    <DocumentViewer
      doc={doc as never}
      summaries={summaries ?? []}
      subjects={subjects ?? []}
      defaultTab={tab ?? 'overview'}
    />
  )
}
