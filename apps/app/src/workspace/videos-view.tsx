import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Download,
  FileText,
  Film,
  Mic2,
  Plus,
  Send,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { cn } from '@/lib/utils'

import type { Video } from './types'
import { DetailBlock } from './ui/detail-block'
import { VideoStage } from './ui/video-stage'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export function VideosView({ videos }: { videos: Video[] }) {
  const [detailVideoId, setDetailVideoId] = useState<string | null>(null)
  const detailVideo = videos.find(video => video.id === detailVideoId)
  const createVideo = useMutation(
    query.workspace.createVideo.mutationOptions({
      onSuccess: async video => {
        await queryClient.invalidateQueries({
          queryKey: query.workspace.show.queryOptions({}).queryKey,
        })
        setDetailVideoId(video.id)
      },
    }),
  )
  const deleteVideo = useMutation(
    query.workspace.deleteVideo.mutationOptions({
      onSuccess: async result => {
        if (detailVideoId === result.id) setDetailVideoId(null)
        await queryClient.invalidateQueries({
          queryKey: query.workspace.show.queryOptions({}).queryKey,
        })
      },
    }),
  )

  return (
    <>
      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Videos</h2>
            <p className="text-sm text-muted-foreground">{videos.length} videos in production</p>
          </div>
          <Button
            type="button"
            disabled={createVideo.isPending}
            onClick={() => createVideo.mutate({ body: {} })}
          >
            <Plus />
            {createVideo.isPending ? 'Creating...' : 'New video'}
          </Button>
        </div>

        <div className="divide-y">
          {videos.length ? (
            videos.map(video => (
              <div
                key={video.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-4 transition hover:bg-muted/50',
                  detailVideoId === video.id && 'bg-muted/60',
                )}
              >
                <button
                  type="button"
                  onClick={() => setDetailVideoId(video.id)}
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
                {video.recordings.length > 0 || video.editingJob ? (
                  <Link
                    to="/videos/$videoId/edit"
                    params={{ videoId: video.id }}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
                  >
                    <SlidersHorizontal />
                    Edit
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <p className="px-4 py-5 text-sm text-muted-foreground">No videos yet</p>
          )}
        </div>
      </section>

      {detailVideo ? (
        <VideoDetailModal
          video={detailVideo}
          isDeleting={deleteVideo.isPending}
          onDelete={() => deleteVideo.mutate({ params: { id: detailVideo.id } })}
          onClose={() => setDetailVideoId(null)}
        />
      ) : null}
    </>
  )
}

function VideoDetailModal({
  video,
  isDeleting,
  onDelete,
  onClose,
}: {
  video: Video
  isDeleting: boolean
  onDelete: () => void
  onClose: () => void
}) {
  const [publishOpen, setPublishOpen] = useState(false)
  const finalVideoUrl = video.editingJob?.finalPath
    ? `${apiBaseUrl}${video.editingJob.finalPath}`
    : ''
  const finalDownloadUrl = `${apiBaseUrl}/content/videos/${video.id}/final.mp4`
  const finalFileName = `${
    video.title
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'video'
  }.mp4`
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

  function downloadFinalVideo() {
    if (!finalVideoUrl) return

    const anchor = document.createElement('a')
    anchor.href = finalDownloadUrl
    anchor.download = finalFileName
    anchor.click()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[min(90vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-card shadow-lg"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-detail-title"
      >
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Video</p>
            <h2 id="video-detail-title" className="mt-1 text-xl font-semibold tracking-tight">
              {video.title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close video details"
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="divide-y">
            <DetailBlock title="Idea">{video.idea}</DetailBlock>
            <DetailBlock title="Transcript">{video.transcript}</DetailBlock>
            {!video.inProduction ? null : (
              <>
                <DetailBlock title="Recording">
                  <RecordingTakes
                    videoId={video.id}
                    recordings={video.recordings}
                    deleteRecording={deleteRecording}
                  />
                </DetailBlock>
                <DetailBlock title="Final edit">
                  {video.editingJob?.status === 'ready' && finalVideoUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <Film className="size-4" />
                        Rendered MP4 ready
                      </div>
                      <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-md bg-black">
                        <video
                          src={finalVideoUrl}
                          className="aspect-[9/16] w-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    </div>
                  ) : video.editingJob?.status === 'failed' ? (
                    <span className="text-destructive">
                      {video.editingJob.errorMessage || 'Render failed'}
                    </span>
                  ) : video.editingJob?.status === 'draft' ? (
                    'Edit settings ready'
                  ) : video.editingJob?.status === 'processing' ? (
                    'Rendering final MP4'
                  ) : video.editingJob?.status === 'queued' ? (
                    'Final edit queued'
                  ) : (
                    'No final edit yet'
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
              </>
            )}
          </div>
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
          {video.recordings.length > 0 || video.editingJob ? (
            <Link
              to="/videos/$videoId/edit"
              params={{ videoId: video.id }}
              className={buttonVariants({ variant: 'outline' })}
            >
              <SlidersHorizontal />
              Edit
            </Link>
          ) : null}
          {finalVideoUrl ? (
            <Button type="button" onClick={() => setPublishOpen(true)}>
              <Send />
              Publish
            </Button>
          ) : null}
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={onDelete}>
            <Trash2 />
            Delete
          </Button>
        </div>

        {publishOpen ? (
          <div
            className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-black/60 p-4"
            onClick={() => setPublishOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-lg border bg-card shadow-lg"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Publish</p>
                  <h3 className="text-lg font-semibold">Preview final MP4</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPublishOpen(false)}
                  aria-label="Close publish preview"
                >
                  <X />
                </Button>
              </div>

              <div className="space-y-4 p-4">
                <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-md bg-black">
                  <video
                    src={finalVideoUrl}
                    className="aspect-[9/16] w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
                    Close
                  </Button>
                  <Button type="button" onClick={downloadFinalVideo}>
                    <Download />
                    Download MP4
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function RecordingTakes({
  videoId,
  recordings,
  deleteRecording,
}: {
  videoId: string
  recordings: Video['recordings']
  deleteRecording: { isPending: boolean; mutate: (recordingId: string) => void }
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [videoId])

  useEffect(() => {
    if (index >= recordings.length) {
      setIndex(Math.max(0, recordings.length - 1))
    }
  }, [index, recordings.length])

  if (recordings.length === 0) {
    return 'No takes yet'
  }

  const recording = recordings[index]
  const hasMultiple = recordings.length > 1

  return (
    <div className="space-y-2 rounded-md border bg-background p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {hasMultiple ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => setIndex(current => current - 1)}
                aria-label="Previous recording"
              >
                <ChevronLeft />
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {index + 1} / {recordings.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={index === recordings.length - 1}
                onClick={() => setIndex(current => current + 1)}
                aria-label="Next recording"
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
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
      {recording.storagePath ? (
        <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-md bg-black">
          <video
            key={recording.id}
            src={`${apiBaseUrl}${recording.storagePath}`}
            className="aspect-[9/16] w-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      ) : null}
    </div>
  )
}
