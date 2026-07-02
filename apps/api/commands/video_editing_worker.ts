import { BaseCommand } from '@adonisjs/core/ace'
import { Worker } from 'bullmq'

import VideoEditingService from '../app/content/services/video_editing_service.ts'
import {
  createRedisConnection,
  videoEditingJobName,
  type VideoEditingQueueData,
  videoEditingQueueName,
} from '../app/content/services/video_editing_queue.ts'

export default class VideoEditingWorker extends BaseCommand {
  static commandName = 'video:editing-worker'
  static description = 'Process queued video editing jobs'
  static options = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const connection = createRedisConnection()
    const editingService = new VideoEditingService()
    const worker = new Worker<VideoEditingQueueData, void, typeof videoEditingJobName>(
      videoEditingQueueName,
      async job => {
        await editingService.process(job.data.editingJobId, job.data.action ?? 'prepare')
      },
      { connection, concurrency: 1 },
    )

    worker.on('completed', job => {
      this.logger.info(`Video editing job completed: ${job.data.editingJobId}`)
    })
    worker.on('failed', (job, error) => {
      this.logger.error(`Video editing job failed: ${job?.data.editingJobId ?? 'unknown'}`)
      this.logger.error(error)
    })

    this.logger.info(`Listening for ${videoEditingQueueName} jobs`)

    await new Promise<void>(resolve => {
      const close = async () => {
        await worker.close()
        resolve()
      }

      process.once('SIGTERM', close)
      process.once('SIGINT', close)
    })
  }
}
