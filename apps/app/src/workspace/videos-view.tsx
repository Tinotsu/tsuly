import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Clapperboard,
  FileText,
  Mic2,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import type { Video } from './types'
import { DetailBlock } from './ui/detail-block'
import { VideoStage } from './ui/video-stage'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export function VideosView({
  videos,
  selectedVideo,
  onSelectVideo,
}: {
  videos: Video[]
  selectedVideo: Video
  onSelectVideo: (id: Video['id']) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_430px]">
      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Videos</h2>
            <p className="text-sm text-muted-foreground">{videos.length} videos in production</p>
          </div>
          <Button type="button">
            <Plus />
            New video
          </Button>
        </div>

        <div className="grid gap-2 border-b p-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search" />
          </div>
          <Button type="button" variant="outline">
            Filter: All
            <ChevronDown />
          </Button>
        </div>

        <div className="divide-y">
          {videos.map(video => (
            <div
              key={video.id}
              className={cn(
                'flex items-start gap-3 px-4 py-4 transition hover:bg-muted/50',
                selectedVideo.id === video.id && 'bg-muted/60',
              )}
            >
              <button
                type="button"
                onClick={() => onSelectVideo(video.id)}
                className="flex min-w-0 flex-1 flex-col gap-3 text-left"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Clapperboard className="size-4 text-sky-700" />
                  {video.title}
                </span>
                <span className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {video.stages.map(stage => (
                    <VideoStage key={stage.label} done={stage.done} label={stage.label} />
                  ))}
                </span>
              </button>
              <Link
                to="/videos/$videoId/script"
                params={{ videoId: video.id }}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
              >
                <FileText />
                Script
              </Link>
            </div>
          ))}
        </div>
      </section>

      <VideoDetail video={selectedVideo} />
    </div>
  )
}

function VideoDetail({ video }: { video: Video }) {
  const deleteRecording = useMutation({
    mutationFn: async (recordingId: string) => {
      const response = await fetch(
        `${apiBaseUrl}/content/videos/${video.id}/recordings/${recordingId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        },
      )

      if (!response.ok) throw new Error('Delete failed')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: query.workspace.show.queryOptions({}).queryKey,
      })
    },
  })

  return (
    <aside className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <p className="text-sm font-medium text-muted-foreground">Video</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{video.title}</h2>
      </div>

      <div className="divide-y">
        <DetailBlock title="Idea">{video.idea}</DetailBlock>
        <DetailBlock title="Transcript">{video.transcript}</DetailBlock>
        <DetailBlock title="Recording">
          {video.recordings.length > 0 ? (
            <ul className="space-y-2">
              {video.recordings.map(recording => (
                <li key={recording.id} className="space-y-2 rounded-md border bg-background p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Mic2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{recording.label}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={deleteRecording.isPending}
                      onClick={() => deleteRecording.mutate(recording.id)}
                      aria-label={`Delete ${recording.label}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {recording.storagePath && (
                    <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-md bg-black">
                      <video
                        src={`${apiBaseUrl}${recording.storagePath}`}
                        className="aspect-[9/16] w-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            'No takes yet'
          )}
        </DetailBlock>
        <DetailBlock title="Editing">
          <div className="space-y-2">
            {video.editing.map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded border',
                    item.done && 'border-emerald-600 bg-emerald-600 text-white',
                  )}
                >
                  {item.done && <Check className="size-3.5" />}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </DetailBlock>
        <DetailBlock title="Preview">{video.preview}</DetailBlock>
        <DetailBlock title="Publish">{video.publish}</DetailBlock>
      </div>

      <div className="flex flex-wrap gap-2 border-t p-4">
        <Link
          to="/videos/$videoId/script"
          params={{ videoId: video.id }}
          className={buttonVariants({ variant: 'outline' })}
        >
          <FileText />
          Script
        </Link>
        <Link
          to="/videos/$videoId/record"
          params={{ videoId: video.id }}
          className={buttonVariants({ variant: 'outline' })}
        >
          <Mic2 />
          Record
        </Link>
        <Button type="button" variant="outline">
          <Check />
          Validate
        </Button>
        <Button type="button">
          <Send />
          Publish
        </Button>
      </div>
    </aside>
  )
}
