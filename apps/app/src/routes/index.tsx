import { createFileRoute } from '@tanstack/react-router'

import { redirectToLoginIfNotAuthenticated } from '@/hooks/auth'
import { WorkspacePage } from '@/workspace/workspace-page'

export const Route = createFileRoute('/')({
  component: WorkspacePage,
  beforeLoad: async () => await redirectToLoginIfNotAuthenticated(),
})
