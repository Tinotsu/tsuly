import { useSuspenseQuery } from '@tanstack/react-query'
import { BrainCircuit, Clapperboard, Lightbulb } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { query } from '@/lib/tuyau'

import { BrandBrainView } from './brand-brain-view'
import { tabHashes } from './constants'
import { EmptyWorkspace } from './empty-workspace'
import { IdeasView } from './ideas-view'
import { tabFromHash } from './tab'
import type { WorkspaceTab } from './types'
import { TabButton } from './ui/tab-button'
import { VideosView } from './videos-view'

export function WorkspacePage() {
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
            selectedIdeaId={selectedIdeaId}
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
