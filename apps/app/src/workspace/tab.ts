import { tabHashes } from './constants'
import type { WorkspaceTab } from './types'

export function tabFromHash(): WorkspaceTab {
  const hash = window.location.hash.replace('#', '')

  if (hash === tabHashes.videos) {
    return 'videos'
  }

  if (hash === tabHashes.brand) {
    return 'brand'
  }

  return 'ideas'
}
