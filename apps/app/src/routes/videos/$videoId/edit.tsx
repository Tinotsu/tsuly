import { createFileRoute } from '@tanstack/react-router'

import { EditPage } from '@/edit/edit-page'
import { redirectToLoginIfNotAuthenticated } from '@/hooks/auth'

export const Route = createFileRoute('/videos/$videoId/edit')({
  component: RouteComponent,
  beforeLoad: async () => await redirectToLoginIfNotAuthenticated(),
})

function RouteComponent() {
  const { videoId } = Route.useParams()

  return <EditPage videoId={videoId} />
}
