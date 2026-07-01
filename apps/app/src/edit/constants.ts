export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export const captionFontOptions = [
  'Inter',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Bebas Neue',
  'Anton',
  'Bangers',
  'Luckiest Guy',
  'Playfair Display',
  'Roboto Mono',
] as const

export const positionOptions = [
  { value: 'top', label: 'Top' },
  { value: 'middle', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
] as const
