import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, FileText, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import { limitCardValue } from './card-text'
import {
  BRAND_BRAIN_CARD_LINE_CAPACITY,
  BRAND_BRAIN_CARD_LINE_HEIGHT_REM,
  brandIcons,
} from './constants'
import type { BrandSection } from './types'

export function BrandBrainView({
  sections,
  selectedSection,
  onSelectSection,
}: {
  sections: BrandSection[]
  selectedSection: BrandSection
  onSelectSection: (id: BrandSection['id']) => void
}) {
  const [draftSections, setDraftSections] = useState(sections)
  const queryClient = useQueryClient()
  const draftSelectedSection =
    draftSections.find(section => section.id === selectedSection.id) ?? draftSections[0]
  const SelectedIcon = brandIcons[draftSelectedSection.key] ?? FileText
  const saveField = useMutation(query.workspace.updateBrandBrainField.mutationOptions())
  const createField = useMutation(
    query.workspace.createBrandBrainField.mutationOptions({
      onSuccess: (field, variables) => {
        setDraftSections(current =>
          current.map(section =>
            section.id === variables.params.sectionId
              ? { ...section, fields: [...section.fields, field] }
              : section,
          ),
        )
      },
    }),
  )
  const deleteField = useMutation(
    query.workspace.deleteBrandBrainField.mutationOptions({
      onSuccess: async (_result, variables) => {
        setDraftSections(current =>
          current.map(section =>
            section.fields.some(field => field.id === variables.params.id)
              ? {
                  ...section,
                  fields: section.fields.filter(field => field.id !== variables.params.id),
                }
              : section,
          ),
        )
        await queryClient.invalidateQueries({
          queryKey: query.workspace.show.queryOptions({}).queryKey,
        })
      },
    }),
  )

  useEffect(() => setDraftSections(sections), [sections])

  function updateDraftField(
    sectionId: BrandSection['id'],
    fieldId: BrandSection['fields'][number]['id'],
    values: Partial<BrandSection['fields'][number]>,
  ) {
    setDraftSections(current =>
      current.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId ? { ...field, ...values } : field,
              ),
            }
          : section,
      ),
    )
  }

  function saveDraftField(section: BrandSection, field: BrandSection['fields'][number]) {
    saveField.mutate({
      params: { id: field.id },
      body:
        section.key === 'context'
          ? { label: field.label, value: field.value }
          : { value: field.value },
    })
  }

  function addExtraContextCard() {
    createField.mutate({
      params: { sectionId: draftSelectedSection.id },
      body: { label: 'New card', value: '' },
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-lg border bg-card p-3">
        <div className="flex items-start justify-between gap-3 px-1 pb-3">
          <div>
            <h2 className="text-lg font-semibold">Brand Brain</h2>
            <p className="text-sm text-muted-foreground">Context used by generation</p>
          </div>
          {draftSelectedSection.key === 'context' && (
            <Button type="button" size="sm" onClick={addExtraContextCard}>
              <Plus />
              Card
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {draftSections.map(section => {
            const Icon = brandIcons[section.key] ?? FileText

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition hover:bg-muted/60',
                  selectedSection.id === section.id && 'border-foreground/15 bg-muted',
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block font-medium">{section.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                    {section.summary}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="flex items-start gap-3 border-b p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
            <SelectedIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Brand Brain</p>
            <h2 className="text-xl font-semibold tracking-tight">{draftSelectedSection.title}</h2>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          {draftSelectedSection.fields.map(field => (
            <div key={field.id} className="rounded-lg border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                {draftSelectedSection.key === 'context' ? (
                  <input
                    value={field.label}
                    onChange={event =>
                      updateDraftField(draftSelectedSection.id, field.id, {
                        label: event.target.value,
                      })
                    }
                    onBlur={() => saveDraftField(draftSelectedSection, field)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-muted-foreground outline-none focus:text-foreground"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                )}
                {draftSelectedSection.key === 'context' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={deleteField.isPending}
                    onClick={() => deleteField.mutate({ params: { id: field.id } })}
                    aria-label={`Delete ${field.label}`}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              <textarea
                value={field.value}
                onChange={event =>
                  updateDraftField(draftSelectedSection.id, field.id, {
                    value: limitCardValue(event.target, event.target.value),
                  })
                }
                onBlur={() => saveDraftField(draftSelectedSection, field)}
                rows={BRAND_BRAIN_CARD_LINE_CAPACITY}
                style={{
                  height: `${BRAND_BRAIN_CARD_LINE_CAPACITY * BRAND_BRAIN_CARD_LINE_HEIGHT_REM}rem`,
                }}
                className="mt-2 w-full resize-none overflow-hidden bg-transparent text-sm font-medium leading-6 text-muted-foreground outline-none focus:text-foreground"
              />
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="rounded-lg bg-[#162116] p-4 text-sm leading-6 text-white">
            <span className="mb-2 flex items-center gap-2 font-medium">
              <Bot className="size-4" />
              AI notes
            </span>
            Use this section when scoring ideas, writing hooks, and deciding which examples match
            the brand voice.
          </div>
        </div>
      </section>
    </div>
  )
}
