import vine from '@vinejs/vine'

const BRAND_BRAIN_CARD_WORD_LIMIT = 500

function countWords(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

const maxWords = vine.createRule<{ limit: number }>(
  (value, { limit }, field) => {
    if (countWords(String(value ?? '')) > limit) {
      field.report(`Must not exceed ${limit} words`, 'maxWords', field, { limit })
    }
  },
  { name: 'maxWords' },
)

const cardText = () =>
  vine
    .string()
    .use(maxWords({ limit: BRAND_BRAIN_CARD_WORD_LIMIT }))
    .nullable()
    .transform(value => value ?? '')

const hexColor = () => vine.string().regex(/^#[0-9a-fA-F]{6}$/)

export const updateBrandBrainFieldValidator = vine.compile(
  vine.object({
    label: vine.string().nullable().optional(),
    value: cardText(),
  }),
)

export const createBrandBrainFieldValidator = vine.compile(
  vine.object({
    label: vine.string(),
    value: cardText(),
  }),
)

export const createIdeaValidator = vine.compile(
  vine.object({
    title: vine.string().optional(),
    note: cardText().optional(),
    pillar: vine.string().optional(),
    rating: vine.number().min(0).max(5).optional(),
    status: vine.string().optional(),
  }),
)

export const updateIdeaValidator = vine.compile(
  vine.object({
    title: vine.string().optional(),
    note: cardText().optional(),
    pillar: vine.string().optional(),
    rating: vine.number().min(0).max(5).optional(),
    status: vine.string().optional(),
  }),
)

export const createVideoValidator = vine.compile(
  vine.object({
    ideaId: vine.string().optional(),
    title: vine.string().optional(),
    idea: cardText().optional(),
  }),
)

export const updateVideoScriptValidator = vine.compile(
  vine.object({
    hook: cardText().optional(),
    spokenScript: cardText().optional(),
    onScreenText: cardText().optional(),
  }),
)

export const chatVideoScriptValidator = vine.compile(
  vine.object({
    message: cardText(),
  }),
)

export const createVideoRecordingValidator = vine.compile(
  vine.object({
    scriptId: vine.string(),
    takeId: vine.string(),
    startedAt: vine.string(),
    stoppedAt: vine.string(),
    durationMs: vine.string(),
    trimStartMs: vine.string().optional(),
    trimEndMs: vine.string().optional(),
  }),
)

export const updateVideoEditingSettingsValidator = vine.compile(
  vine.object({
    trimStartMs: vine.number().min(0).optional(),
    trimEndMs: vine.number().min(1).optional(),
    captionFont: vine
      .string()
      .regex(/^[A-Za-z0-9 ]{1,80}$/)
      .optional(),
    captionFontSize: vine.number().min(36).max(96).optional(),
    captionTextColor: hexColor().optional(),
    captionBackgroundEnabled: vine.boolean().optional(),
    captionBackgroundColor: hexColor().optional(),
    captionBackgroundOpacity: vine.number().min(0).max(100).optional(),
    captionPosition: vine.enum(['top', 'middle', 'bottom'] as const).optional(),
    wordsPerCaption: vine.number().min(3).max(12).optional(),
    removeSilence: vine.boolean().optional(),
    silenceThresholdSeconds: vine.number().min(0.2).max(2).optional(),
  }),
)
