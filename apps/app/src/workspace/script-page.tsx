import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Send, Video } from 'lucide-react'
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

  const currentVideo = video

  function updateDraft(field: keyof Script, value: string) {
    setDraftScript(current => (current ? { ...current, [field]: value } : current))
  }

  function saveField(field: EditableScriptField) {
    if (!draftScript || draftScript[field] === currentVideo.script[field]) return

    const body =
      field === 'hook'
        ? { hook: draftScript.hook }
        : field === 'spokenScript'
          ? { spokenScript: draftScript.spokenScript }
          : { onScreenText: draftScript.onScreenText }

    saveScript.mutate(
      { params: { id: currentVideo.id }, body },
      {
        onSuccess: async result => {
          setDraftScript(result.video.script)
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
      { params: { id: currentVideo.id }, body: { message: trimmed } },
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
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{currentVideo.title}</h1>
          </div>
          <Link
            to="/videos/$videoId/record"
            params={{ videoId: currentVideo.id }}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Video />
            Start recording
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-4">
            {(
              [
                ['Hook', 'hook', 3],
                ['Spoken script', 'spokenScript', 9],
                ['On-screen text', 'onScreenText', 4],
              ] as const
            ).map(([title, field, rows]) => (
              <div key={field} className="rounded-lg border bg-card p-4">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <textarea
                  value={draftScript[field]}
                  rows={rows}
                  onChange={event => updateDraft(field, event.target.value)}
                  onBlur={() => saveField(field)}
                  className="mt-2 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:text-foreground"
                />
              </div>
            ))}
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
