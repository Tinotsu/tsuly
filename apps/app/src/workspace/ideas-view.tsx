import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Plus, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import { limitCardValue } from './card-text'
import { BRAND_BRAIN_CARD_LINE_CAPACITY, BRAND_BRAIN_CARD_LINE_HEIGHT_REM } from './constants'
import type { Idea } from './types'
import { FilterPill } from './ui/filter-pill'
import { StarRating } from './ui/star-rating'

export function IdeasView({
  ideas,
  selectedIdea,
  onSelectIdea,
}: {
  ideas: Idea[]
  selectedIdea: Idea
  onSelectIdea: (id: Idea['id']) => void
}) {
  const [draftIdeas, setDraftIdeas] = useState(ideas)
  const draftSelectedIdea =
    draftIdeas.find(idea => idea.id === selectedIdea.id) ?? draftIdeas[0] ?? selectedIdea
  const saveIdea = useMutation(query.workspace.updateIdea.mutationOptions())
  const createIdea = useMutation(
    query.workspace.createIdea.mutationOptions({
      onSuccess: idea => {
        setDraftIdeas(current => [...current, idea])
        onSelectIdea(idea.id)
      },
    }),
  )

  useEffect(() => setDraftIdeas(ideas), [ideas])

  function updateDraftIdea(id: Idea['id'], values: Partial<Idea>) {
    setDraftIdeas(current => current.map(idea => (idea.id === id ? { ...idea, ...values } : idea)))
  }

  function saveDraftIdea(idea: Idea) {
    saveIdea.mutate({
      params: { id: idea.id },
      body: {
        title: idea.title,
        note: idea.note,
        pillar: idea.pillar,
        rating: idea.rating,
      },
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Ideas</h2>
            <p className="text-sm text-muted-foreground">{draftIdeas.length} active drafts</p>
          </div>
          <Button type="button" onClick={() => createIdea.mutate({ body: {} })}>
            <Plus />
            New idea
          </Button>
        </div>

        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {draftIdeas.map(idea => (
              <button
                key={idea.id}
                type="button"
                onClick={() => onSelectIdea(idea.id)}
                className={cn(
                  'flex min-h-44 flex-col rounded-lg border bg-background p-4 text-left transition hover:border-foreground/30 hover:bg-muted/30',
                  draftSelectedIdea.id === idea.id && 'border-foreground bg-muted/40',
                )}
              >
                <span className="line-clamp-2 text-base font-semibold leading-snug">
                  {idea.title}
                </span>
                <span className="mt-auto">
                  {idea.pillar ? <Badge variant="secondary">{idea.pillar}</Badge> : null}
                  <span
                    className="mt-3 flex items-center gap-0.5"
                    aria-label={`${idea.rating} stars`}
                  >
                    <StarRating rating={idea.rating} />
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-[auto_auto_1fr]">
            <FilterPill>Pillar</FilterPill>
            <FilterPill>Status</FilterPill>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search" />
            </div>
          </div>
        </div>
      </section>

      <IdeaDetail
        idea={draftSelectedIdea}
        onUpdate={values => updateDraftIdea(draftSelectedIdea.id, values)}
        onSave={saveDraftIdea}
      />
    </div>
  )
}

function IdeaDetail({
  idea,
  onUpdate,
  onSave,
}: {
  idea: Idea
  onUpdate: (values: Partial<Idea>) => void
  onSave: (idea: Idea) => void
}) {
  return (
    <aside className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <p className="text-sm font-medium text-muted-foreground">Idea</p>
        <input
          value={idea.title}
          onChange={event => onUpdate({ title: event.target.value })}
          onBlur={() => onSave(idea)}
          className="mt-1 w-full bg-transparent text-xl font-semibold tracking-tight outline-none focus:text-foreground"
        />
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tag</p>
          <input
            value={idea.pillar}
            onChange={event => onUpdate({ pillar: event.target.value })}
            onBlur={() => onSave(idea)}
            placeholder="Add a tag"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:text-foreground"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Rating</p>
          <StarRating
            className="mt-2"
            rating={idea.rating}
            onChange={rating => {
              onUpdate({ rating })
              onSave({ ...idea, rating })
            }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Note</p>
          <textarea
            value={idea.note}
            onChange={event => onUpdate({ note: limitCardValue(event.target, event.target.value) })}
            onBlur={() => onSave(idea)}
            rows={BRAND_BRAIN_CARD_LINE_CAPACITY}
            style={{
              height: `${BRAND_BRAIN_CARD_LINE_CAPACITY * BRAND_BRAIN_CARD_LINE_HEIGHT_REM}rem`,
            }}
            className="mt-2 w-full resize-none overflow-hidden rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t p-4">
        <Button type="button">
          <Sparkles />
          Generate script
        </Button>
        <Button type="button" variant="outline">
          <ArrowRight />
          Move to Videos
        </Button>
      </div>
    </aside>
  )
}
