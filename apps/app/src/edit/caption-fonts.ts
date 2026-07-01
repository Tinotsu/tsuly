import { useEffect } from 'react'

import type { CaptionFont } from './types'

export function useGoogleCaptionFonts(fonts: string[], linkId = 'caption-google-fonts') {
  const fontQuery = fonts.map(font => `family=${googleFontFamilyParam(font)}`).join('&')

  useEffect(() => {
    let link = document.getElementById(linkId) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      document.head.append(link)
    }

    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`
  }, [fontQuery, linkId])
}

export function captionFont(value: string): CaptionFont {
  if (value === 'serif' || value === 'playfair') return 'Playfair Display'
  if (value === 'mono' || value === 'roboto-mono') return 'Roboto Mono'
  if (!value || value === 'sans' || value === 'inter') return 'Inter'
  return value
}

export function fontFamily(font: string) {
  return `${JSON.stringify(captionFont(font))}, Arial, sans-serif`
}

function googleFontFamilyParam(font: string) {
  return encodeURIComponent(font).replaceAll('%20', '+')
}
