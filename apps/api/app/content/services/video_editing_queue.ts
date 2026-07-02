import { Queue } from 'bullmq'

import env from '#start/env'

export type VideoEditingQueueData = {
  editingJobId: string
  action?: VideoEditingQueueAction
}

export type VideoEditingQueueAction = 'prepare' | 'render_final'

export const videoEditingQueueName = 'video-editing'
export const videoEditingJobName = 'edit-video'

export function createRedisConnection() {
  const url = new URL(env.get('REDIS_URL') ?? 'redis://localhost:6379')

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: Number(url.pathname.replace('/', '') || 0),
    maxRetriesPerRequest: null,
  }
}

export async function enqueueVideoEditingJob(
  editingJobId: string,
  action: VideoEditingQueueAction = 'prepare',
) {
  const connection = createRedisConnection()
  const queue = new Queue<VideoEditingQueueData, void, typeof videoEditingJobName>(
    videoEditingQueueName,
    { connection },
  )

  try {
    await queue.add(
      videoEditingJobName,
      { editingJobId, action },
      {
        attempts: 1,
        removeOnComplete: true,
      },
    )
  } finally {
    await queue.close()
  }
}
