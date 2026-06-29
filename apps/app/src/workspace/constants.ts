import { FileText, Globe2, Mic2, Target, UserRound, UsersRound, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

import type { WorkspaceTab } from './types'

export const tabHashes: Record<WorkspaceTab, string> = {
  ideas: 'ideas',
  videos: 'videos',
  brand: 'brand-brain',
}

export const brandIcons: Record<string, ComponentType<{ className?: string }>> = {
  me: UserRound,
  icp: Target,
  product: Zap,
  website: Globe2,
  voice: Mic2,
  competitors: UsersRound,
  context: FileText,
}

export const BRAND_BRAIN_CARD_WORD_LIMIT = 500
export const BRAND_BRAIN_CARD_LINE_CAPACITY = 5
export const BRAND_BRAIN_CARD_LINE_HEIGHT_REM = 1.5
