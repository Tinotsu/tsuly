import { createFileRoute } from '@tanstack/react-router'

import { redirectToLoginIfNotAuthenticated } from '@/hooks/auth'
import { RecordingPage } from '@/workspace/recording-page'

export const Route = createFileRoute('/videos/$videoId/record')({
  component: RouteComponent,
  beforeLoad: async () => await redirectToLoginIfNotAuthenticated(),
})

function RouteComponent() {
  const { videoId } = Route.useParams()

  return <RecordingPage videoId={videoId} />
}
