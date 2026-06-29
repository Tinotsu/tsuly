import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Circle,
  Clapperboard,
  FileText,
  Globe2,
  Lightbulb,
  Mic2,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Target,
  UserRound,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'

import { query } from '@/lib/tuyau'
import { redirectToLoginIfNotAuthenticated } from '@/hooks/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: async () => await redirectToLoginIfNotAuthenticated(),
})

type Workspace = {
  ideas: Array<{
    id: string
    title: string
    pillar: string
    status: string
    rating: number
    problem: string
    hook: string
    keyPoints: string[]
    cta: string
  }>
  videos: Array<{
    id: string
    title: string
    idea: string
    transcript: string
    recordings: string[]
    editing: Array<{ label: string; done: boolean }>
    preview: string
    publish: string
    stages: Array<{ label: string; done: boolean }>
  }>
  brandBrain: Array<{
    id: string
    key: string
    title: string
    summary: string
    fields: Array<{ id: string; label: string; value: string }>
  }>
}

type WorkspaceTab = 'ideas' | 'videos' | 'brand'
type Idea = Workspace['ideas'][number]
type Video = Workspace['videos'][number]
type BrandSection = Workspace['brandBrain'][number]

const tabHashes: Record<WorkspaceTab, string> = {
  ideas: 'ideas',
  videos: 'videos',
  brand: 'brand-brain',
}

const brandIcons: Record<string, ComponentType<{ className?: string }>> = {
  me: UserRound,
  icp: Target,
  product: Zap,
  website: Globe2,
  voice: Mic2,
  competitors: UsersRound,
  context: FileText,
}

function App() {
  const { data: workspace } = useSuspenseQuery(
    query.workspace.show.queryOptions({}, { staleTime: 30_000 }),
  )

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => tabFromHash())
  const [selectedIdeaId, setSelectedIdeaId] = useState(workspace.ideas[0]?.id ?? '')
  const [selectedVideoId, setSelectedVideoId] = useState(workspace.videos[1]?.id ?? '')
  const [selectedBrandSectionId, setSelectedBrandSectionId] = useState(
    workspace.brandBrain[1]?.id ?? '',
  )

  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash())

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!workspace.ideas.some(idea => idea.id === selectedIdeaId)) {
      setSelectedIdeaId(workspace.ideas[0]?.id ?? '')
    }
    if (!workspace.videos.some(video => video.id === selectedVideoId)) {
      setSelectedVideoId(workspace.videos[0]?.id ?? '')
    }
    if (!workspace.brandBrain.some(section => section.id === selectedBrandSectionId)) {
      setSelectedBrandSectionId(workspace.brandBrain[0]?.id ?? '')
    }
  }, [selectedBrandSectionId, selectedIdeaId, selectedVideoId, workspace])

  const selectedIdea = useMemo(
    () => workspace.ideas.find(idea => idea.id === selectedIdeaId) ?? workspace.ideas[0],
    [selectedIdeaId, workspace.ideas],
  )
  const selectedVideo = useMemo(
    () => workspace.videos.find(video => video.id === selectedVideoId) ?? workspace.videos[0],
    [selectedVideoId, workspace.videos],
  )
  const selectedBrandSection = useMemo(
    () =>
      workspace.brandBrain.find(section => section.id === selectedBrandSectionId) ??
      workspace.brandBrain[0],
    [selectedBrandSectionId, workspace.brandBrain],
  )

  function selectTab(tab: WorkspaceTab) {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#${tabHashes[tab]}`)
  }

  if (!selectedIdea || !selectedVideo || !selectedBrandSection) {
    return <EmptyWorkspace />
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7f5] text-[#171812]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight">Tsuly</h1>
          </div>

          <div className="flex rounded-lg border bg-card p-1">
            <TabButton active={activeTab === 'ideas'} onClick={() => selectTab('ideas')}>
              <Lightbulb />
              Ideas
            </TabButton>
            <TabButton active={activeTab === 'videos'} onClick={() => selectTab('videos')}>
              <Clapperboard />
              Videos
            </TabButton>
            <TabButton active={activeTab === 'brand'} onClick={() => selectTab('brand')}>
              <BrainCircuit />
              Brand Brain
            </TabButton>
          </div>
        </div>

        {activeTab === 'ideas' && (
          <IdeasView
            ideas={workspace.ideas}
            selectedIdea={selectedIdea}
            onSelectIdea={setSelectedIdeaId}
          />
        )}
        {activeTab === 'videos' && (
          <VideosView
            videos={workspace.videos}
            selectedVideo={selectedVideo}
            onSelectVideo={setSelectedVideoId}
          />
        )}
        {activeTab === 'brand' && (
          <BrandBrainView
            sections={workspace.brandBrain}
            selectedSection={selectedBrandSection}
            onSelectSection={setSelectedBrandSectionId}
          />
        )}
      </div>
    </main>
  )
}

function EmptyWorkspace() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f6f7f5] px-4">
      <div className="rounded-lg border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">Workspace is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">No content has been created yet.</p>
      </div>
    </main>
  )
}

function IdeasView({
  ideas,
  selectedIdea,
  onSelectIdea,
}: {
  ideas: Idea[]
  selectedIdea: Idea
  onSelectIdea: (id: Idea['id']) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Ideas</h2>
            <p className="text-sm text-muted-foreground">{ideas.length} active drafts</p>
          </div>
          <Button type="button">
            <Plus />
            New idea
          </Button>
        </div>

        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ideas.map(idea => (
              <button
                key={idea.id}
                type="button"
                onClick={() => onSelectIdea(idea.id)}
                className={cn(
                  'flex min-h-44 flex-col rounded-lg border bg-background p-4 text-left transition hover:border-foreground/30 hover:bg-muted/30',
                  selectedIdea.id === idea.id && 'border-foreground bg-muted/40',
                )}
              >
                <span className="line-clamp-2 text-base font-semibold leading-snug">
                  {idea.title}
                </span>
                <span className="mt-auto">
                  <Badge variant="secondary">{idea.pillar}</Badge>
                  <span
                    className="mt-3 flex items-center gap-0.5"
                    aria-label={`${idea.rating} stars`}
                  >
                    <Stars rating={idea.rating} />
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-2 border-t pt-4 md:grid-cols-[auto_auto_1fr]">
            <FilterPill>Pillar</FilterPill>
            <FilterPill>Status</FilterPill>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search" />
            </div>
          </div>
        </div>
      </section>

      <IdeaDetail idea={selectedIdea} />
    </div>
  )
}

function IdeaDetail({ idea }: { idea: Idea }) {
  return (
    <aside className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <p className="text-sm font-medium text-muted-foreground">Idea</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{idea.title}</h2>
      </div>

      <div className="space-y-4 p-4">
        <Field label="Problem">{idea.problem}</Field>
        <Field label="Hook">{idea.hook}</Field>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Key points</p>
          <ul className="mt-2 space-y-2">
            {idea.keyPoints.map(point => (
              <li key={point} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                {point}
              </li>
            ))}
          </ul>
        </div>
        <Field label="CTA">{idea.cta}</Field>
      </div>

      <div className="flex flex-wrap gap-2 border-t p-4">
        <Button type="button">
          <Sparkles />
          Generate script
        </Button>
        <Button type="button" variant="outline">
          <ArrowRight />
          Move to Videos
        </Button>
      </div>
    </aside>
  )
}

function VideosView({
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
            <button
              key={video.id}
              type="button"
              onClick={() => onSelectVideo(video.id)}
              className={cn(
                'flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-muted/50',
                selectedVideo.id === video.id && 'bg-muted/60',
              )}
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
          ))}
        </div>
      </section>

      <VideoDetail video={selectedVideo} />
    </div>
  )
}

function VideoDetail({ video }: { video: Video }) {
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
                <li key={recording} className="flex items-center gap-2">
                  <Mic2 className="size-4 text-muted-foreground" />
                  {recording}
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
        <Button type="button" variant="outline">
          <Mic2 />
          Record
        </Button>
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

function BrandBrainView({
  sections,
  selectedSection,
  onSelectSection,
}: {
  sections: BrandSection[]
  selectedSection: BrandSection
  onSelectSection: (id: BrandSection['id']) => void
}) {
  const [draftSections, setDraftSections] = useState(sections)
  const draftSelectedSection =
    draftSections.find(section => section.id === selectedSection.id) ?? draftSections[0]
  const SelectedIcon = brandIcons[draftSelectedSection.key] ?? FileText
  const saveField = useMutation(query.workspace.updateBrandBrainField.mutationOptions())
  const createField = useMutation(
    query.workspace.createBrandBrainField.mutationOptions({
      onSuccess: (field, variables) => {
        setDraftSections(current =>
          current.map(section =>
            section.id === variables.params.sectionId
              ? { ...section, fields: [...section.fields, field] }
              : section,
          ),
        )
      },
    }),
  )

  useEffect(() => setDraftSections(sections), [sections])

  function updateDraftField(
    sectionId: BrandSection['id'],
    fieldId: BrandSection['fields'][number]['id'],
    values: Partial<BrandSection['fields'][number]>,
  ) {
    setDraftSections(current =>
      current.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId ? { ...field, ...values } : field,
              ),
            }
          : section,
      ),
    )
  }

  function saveDraftField(section: BrandSection, field: BrandSection['fields'][number]) {
    saveField.mutate({
      params: { id: field.id },
      body:
        section.key === 'context'
          ? { label: field.label, value: field.value }
          : { value: field.value },
    })
  }

  function addExtraContextCard() {
    createField.mutate({
      params: { sectionId: draftSelectedSection.id },
      body: { label: 'New card', value: '' },
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-lg border bg-card p-3">
        <div className="flex items-start justify-between gap-3 px-1 pb-3">
          <div>
            <h2 className="text-lg font-semibold">Brand Brain</h2>
            <p className="text-sm text-muted-foreground">Context used by generation</p>
          </div>
          {draftSelectedSection.key === 'context' && (
            <Button type="button" size="sm" onClick={addExtraContextCard}>
              <Plus />
              Card
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {draftSections.map(section => {
            const Icon = brandIcons[section.key] ?? FileText

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition hover:bg-muted/60',
                  selectedSection.id === section.id && 'border-foreground/15 bg-muted',
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block font-medium">{section.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                    {section.summary}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="flex items-start gap-3 border-b p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
            <SelectedIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Brand Brain</p>
            <h2 className="text-xl font-semibold tracking-tight">{draftSelectedSection.title}</h2>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          {draftSelectedSection.fields.map(field => (
            <div key={field.id} className="rounded-lg border bg-background p-4">
              {draftSelectedSection.key === 'context' ? (
                <input
                  value={field.label}
                  onChange={event =>
                    updateDraftField(draftSelectedSection.id, field.id, {
                      label: event.target.value,
                    })
                  }
                  onBlur={() => saveDraftField(draftSelectedSection, field)}
                  className="w-full bg-transparent text-sm font-medium text-muted-foreground outline-none focus:text-foreground"
                />
              ) : (
                <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
              )}
              <textarea
                value={field.value}
                onChange={event =>
                  updateDraftField(draftSelectedSection.id, field.id, {
                    value: event.target.value,
                  })
                }
                onBlur={() => saveDraftField(draftSelectedSection, field)}
                className="mt-2 w-full resize-none bg-transparent text-sm font-medium text-muted-foreground outline-none focus:text-foreground"
              />
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="rounded-lg bg-[#162116] p-4 text-sm leading-6 text-white">
            <span className="mb-2 flex items-center gap-2 font-medium">
              <Bot className="size-4" />
              AI notes
            </span>
            Use this section when scoring ideas, writing hooks, and deciding which examples match
            the brand voice.
          </div>
        </div>
      </section>
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground [&_svg]:size-4',
        active && 'bg-foreground text-background shadow-sm hover:text-background',
      )}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 rounded-md border bg-background px-3 py-2 text-sm leading-6">{children}</p>
    </div>
  )
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="text-sm leading-6">{children}</div>
    </div>
  )
}

function FilterPill({ children }: { children: ReactNode }) {
  return (
    <Button type="button" variant="outline">
      {children}
      <ChevronDown />
    </Button>
  )
}

function Stars({ rating }: { rating: number }) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={cn(
        'size-4',
        index < rating ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/30',
      )}
    />
  ))
}

function VideoStage({ done, label }: { done: boolean; label: string }) {
  const Icon = done ? Check : Circle

  return (
    <span className={cn('flex items-center gap-1', done && 'text-foreground')}>
      <Icon className={cn('size-3.5', done && 'text-emerald-700')} />
      {label}
    </span>
  )
}

function tabFromHash(): WorkspaceTab {
  const hash = window.location.hash.replace('#', '')

  if (hash === tabHashes.videos) {
    return 'videos'
  }

  if (hash === tabHashes.brand) {
    return 'brand'
  }

  return 'ideas'
}
