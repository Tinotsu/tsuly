import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, FolderOpen, Pencil, Save, Send, Video } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import type { Video as WorkspaceVideo } from './types'

type EditableScriptField = 'hook' | 'spokenScript' | 'onScreenText'
type Script = WorkspaceVideo['script']
type ChatMessage = { role: 'you' | 'ai'; content: string }

export function ScriptPage({ videoId }: { videoId: string }) {
  const { data: workspace } = useSuspenseQuery(
    query.workspace.show.queryOptions({}, { staleTime: 30_000 }),
  )
  const video = workspace.videos.find(item => item.id === videoId)
  const [draftScript, setDraftScript] = useState<Script | null>(video?.script ?? null)
  const [editing, setEditing] = useState<Record<EditableScriptField, boolean>>({
    hook: false,
    spokenScript: false,
    onScreenText: false,
  })
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const saveScript = useMutation(query.workspace.updateVideoScript.mutationOptions())
  const chatScript = useMutation(query.workspace.chatVideoScript.mutationOptions())

  useEffect(() => {
    setDraftScript(video?.script ?? null)
  }, [video?.script])

  if (!video || !draftScript) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] p-6 text-[#171812]">
        <div className="mx-auto max-w-3xl rounded-lg border bg-card p-6">
          <p className="text-lg font-semibold">Script not found</p>
          <Link to="/" hash="videos" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
            <ArrowLeft />
            Back to videos
          </Link>
        </div>
      </main>
    )
  }

  const selectedVideo = video

  function updateDraft(field: keyof Script, value: string) {
    setDraftScript(current => (current ? { ...current, [field]: value } : current))
  }

  function saveField(field: EditableScriptField) {
    if (!draftScript) return

    const body =
      field === 'hook'
        ? { hook: draftScript.hook }
        : field === 'spokenScript'
          ? { spokenScript: draftScript.spokenScript }
          : { onScreenText: draftScript.onScreenText }

    saveScript.mutate(
      { params: { id: selectedVideo.id }, body },
      {
        onSuccess: async result => {
          setDraftScript(result.video.script)
          setEditing(current => ({ ...current, [field]: false }))
          setMessages(current => [
            ...current,
            { role: 'ai', content: `Updated:\n${result.summary}` },
          ])
          await queryClient.invalidateQueries({
            queryKey: query.workspace.show.queryOptions({}).queryKey,
          })
        },
      },
    )
  }

  function sendMessage(message: string) {
    const trimmed = message.trim()
    if (!trimmed) return

    setMessages(current => [...current, { role: 'you', content: trimmed }])
    setChatInput('')
    chatScript.mutate(
      { params: { id: selectedVideo.id }, body: { message: trimmed } },
      {
        onSuccess: async result => {
          setDraftScript(result.video.script)
          setMessages(current => [
            ...current,
            { role: 'ai', content: `Updated:\n${result.summary}` },
          ])
          await queryClient.invalidateQueries({
            queryKey: query.workspace.show.queryOptions({}).queryKey,
          })
        },
      },
    )
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] text-[#171812]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/"
              hash="videos"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Videos
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{selectedVideo.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/videos/$videoId/record"
              params={{ videoId: selectedVideo.id }}
              className={buttonVariants({ variant: 'outline' })}
            >
              <Video />
              Start recording
            </Link>
            <Button type="button">
              <FolderOpen />
              Fill assets
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-4">
            <EditableScriptBlock
              title="Hook"
              rows={3}
              value={draftScript.hook}
              editing={editing.hook}
              isSaving={saveScript.isPending}
              onEdit={() => setEditing(current => ({ ...current, hook: true }))}
              onSave={() => saveField('hook')}
              onChange={value => updateDraft('hook', value)}
            />
            <EditableScriptBlock
              title="Spoken script"
              rows={9}
              value={draftScript.spokenScript}
              editing={editing.spokenScript}
              isSaving={saveScript.isPending}
              onEdit={() => setEditing(current => ({ ...current, spokenScript: true }))}
              onSave={() => saveField('spokenScript')}
              onChange={value => updateDraft('spokenScript', value)}
            />
            <EditableScriptBlock
              title="On-screen text"
              rows={4}
              value={draftScript.onScreenText}
              editing={editing.onScreenText}
              isSaving={saveScript.isPending}
              onEdit={() => setEditing(current => ({ ...current, onScreenText: true }))}
              onSave={() => saveField('onScreenText')}
              onChange={value => updateDraft('onScreenText', value)}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <ScriptTextBlock title="Shot list">{draftScript.shotList}</ScriptTextBlock>
              <ScriptTextBlock title="Assets needed">{draftScript.assetsNeeded}</ScriptTextBlock>
              <ScriptTextBlock title="Recording notes">
                {draftScript.recordingNotes}
              </ScriptTextBlock>
            </div>
          </section>

          <aside className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col rounded-lg border bg-card lg:sticky lg:top-20">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">AI Assistant</h2>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className="rounded-lg border bg-background p-3"
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    {message.role === 'you' ? 'You' : 'AI'}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">{message.content}</p>
                </div>
              ))}
            </div>
            <form
              className="border-t p-4"
              onSubmit={event => {
                event.preventDefault()
                sendMessage(chatInput)
              }}
            >
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  placeholder="Ask AI..."
                />
                <Button type="submit" disabled={chatScript.isPending}>
                  <Send />
                  Send
                </Button>
              </div>
              <div className="mt-4 grid gap-2">
                {['Make more viral', 'More UGC', 'Less salesy', 'Add B-roll'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-md border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </aside>
        </div>
      </div>
    </main>
  )
}

function EditableScriptBlock({
  title,
  value,
  rows,
  editing,
  isSaving,
  onEdit,
  onSave,
  onChange,
}: {
  title: string
  value: string
  rows: number
  editing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          <Button type="button" size="sm" disabled={!editing || isSaving} onClick={onSave}>
            <Save />
            Save
          </Button>
        </div>
      </div>
      <textarea
        value={value}
        readOnly={!editing}
        rows={rows}
        onChange={event => onChange(event.target.value)}
        className={cn(
          'w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:text-foreground',
          !editing && 'text-muted-foreground',
        )}
      />
    </div>
  )
}

function ScriptTextBlock({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 min-h-40 whitespace-pre-line text-sm leading-6 text-muted-foreground">
        {children}
      </p>
    </div>
  )
}
