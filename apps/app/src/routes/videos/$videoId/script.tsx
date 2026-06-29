import { createFileRoute } from '@tanstack/react-router'

import { redirectToLoginIfNotAuthenticated } from '@/hooks/auth'
import { ScriptPage } from '@/workspace/script-page'

export const Route = createFileRoute('/videos/$videoId/script')({
  component: RouteComponent,
  beforeLoad: async () => await redirectToLoginIfNotAuthenticated(),
})

function RouteComponent() {
  const { videoId } = Route.useParams()

  return <ScriptPage videoId={videoId} />
}
