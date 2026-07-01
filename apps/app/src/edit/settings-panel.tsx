import { ChevronDown } from 'lucide-react'
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { fontFamily, useGoogleCaptionFonts } from './caption-fonts'
import { positionOptions } from './constants'
import type { DraftSettings } from './types'

export function SettingsPanel({
  draft,
  fontOptions,
  searchOptions,
  disabled,
  durationSeconds,
  trimStartSeconds,
  trimEndSeconds,
  onChange,
}: {
  draft: DraftSettings
  fontOptions: string[]
  searchOptions: string[]
  disabled: boolean
  durationSeconds: number
  trimStartSeconds: number
  trimEndSeconds: number
  onChange: Dispatch<SetStateAction<DraftSettings | null>>
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <h2 className="text-lg font-semibold">Edit settings</h2>

      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>Font</Label>
          <FontField
            value={draft.captionFont}
            options={fontOptions}
            searchOptions={searchOptions}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'captionFont', value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Font size"
            value={draft.captionFontSize}
            min={36}
            max={96}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'captionFontSize', value)}
          />
          <NumberField
            label="Words"
            value={draft.wordsPerCaption}
            min={3}
            max={12}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'wordsPerCaption', value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Text"
            value={draft.captionTextColor}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'captionTextColor', value)}
          />
          <ColorField
            label="Background"
            value={draft.captionBackgroundColor}
            disabled={disabled || !draft.captionBackgroundEnabled}
            onChange={value => updateDraft(onChange, 'captionBackgroundColor', value)}
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium">
          Background box
          <input
            type="checkbox"
            checked={draft.captionBackgroundEnabled}
            disabled={disabled}
            onChange={event =>
              updateDraft(onChange, 'captionBackgroundEnabled', event.target.checked)
            }
            className="size-4"
          />
        </label>

        <NumberField
          label="Background opacity"
          value={draft.captionBackgroundOpacity}
          min={0}
          max={100}
          disabled={disabled || !draft.captionBackgroundEnabled}
          onChange={value => updateDraft(onChange, 'captionBackgroundOpacity', value)}
        />

        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid grid-cols-3 gap-2">
            {positionOptions.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={draft.captionPosition === option.value ? 'default' : 'outline'}
                disabled={disabled}
                onClick={() => updateDraft(onChange, 'captionPosition', option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Trim start"
            value={roundSeconds(trimStartSeconds)}
            min={0}
            max={durationSeconds}
            step={0.1}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'trimStartMs', Math.round(value * 1000))}
          />
          <NumberField
            label="Trim end"
            value={roundSeconds(trimEndSeconds)}
            min={0.1}
            max={durationSeconds}
            step={0.1}
            disabled={disabled}
            onChange={value => updateDraft(onChange, 'trimEndMs', Math.round(value * 1000))}
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium">
          Silence removal
          <input
            type="checkbox"
            checked={draft.removeSilence}
            disabled={disabled}
            onChange={event => updateDraft(onChange, 'removeSilence', event.target.checked)}
            className="size-4"
          />
        </label>

        <NumberField
          label="Silence threshold"
          value={draft.silenceThresholdSeconds}
          min={0.2}
          max={2}
          step={0.1}
          disabled={disabled || !draft.removeSilence}
          onChange={value => updateDraft(onChange, 'silenceThresholdSeconds', value)}
        />
      </div>
    </div>
  )
}

function FontField({
  value,
  options,
  searchOptions,
  disabled,
  onChange,
}: {
  value: string
  options: string[]
  searchOptions: string[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState('')
  const shownOptions = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return options

    return searchOptions
      .filter(font => font.toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(term)
        const bStarts = b.toLowerCase().startsWith(term)
        if (aStarts !== bStarts) return aStarts ? -1 : 1
        return a.localeCompare(b)
      })
      .slice(0, 20)
  }, [options, search, searchOptions])

  useGoogleCaptionFonts(shownOptions, 'caption-google-font-menu')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-auto w-full justify-between px-3 py-2 text-left',
        )}
      >
        <span className="min-w-0">
          <FontSample font={value} />
        </span>
        <ChevronDown className="size-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72">
        <div className="sticky top-0 z-10 bg-popover p-1">
          <Input
            value={search}
            placeholder="Search fonts"
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        {shownOptions.length ? (
          shownOptions.map(font => (
            <DropdownMenuItem
              key={font}
              onClick={() => onChange(font)}
              className={cn('px-2 py-2', font === value && 'bg-accent')}
            >
              <span
                className="truncate text-xl font-bold leading-tight"
                style={{ fontFamily: fontFamily(font) }}
              >
                {font}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-2 text-sm text-muted-foreground">No font found</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FontSample({ font }: { font: string }) {
  return (
    <>
      <span className="block text-xs font-medium text-muted-foreground">{font}</span>
      <span
        className="block truncate text-xl font-bold leading-tight"
        style={{ fontFamily: fontFamily(font) }}
      >
        Your captions
      </span>
    </>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={event => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function ColorField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="color"
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        className="p-1"
      />
    </div>
  )
}

function updateDraft<K extends keyof DraftSettings>(
  setDraft: Dispatch<SetStateAction<DraftSettings | null>>,
  key: K,
  value: DraftSettings[K],
) {
  setDraft(current => (current ? { ...current, [key]: value } : current))
}

function roundSeconds(seconds: number) {
  return Math.round(seconds * 10) / 10
}
