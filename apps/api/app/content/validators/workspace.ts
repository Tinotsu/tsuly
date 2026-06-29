import vine from '@vinejs/vine'

const text = () =>
  vine
    .string()
    .nullable()
    .transform(value => value ?? '')

export const updateBrandBrainFieldValidator = vine.compile(
  vine.object({
    label: vine.string().nullable().optional(),
    value: text(),
  }),
)

export const createBrandBrainFieldValidator = vine.compile(
  vine.object({
    label: vine.string(),
    value: text(),
  }),
)
