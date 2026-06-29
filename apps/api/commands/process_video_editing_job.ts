import { BaseCommand, args } from '@adonisjs/core/ace'

import VideoEditingService from '../app/content/services/video_editing_service.ts'

export default class ProcessVideoEditingJob extends BaseCommand {
  static commandName = 'video:process-editing-job'
  static description = 'Process one video editing job immediately'
  static options = {
    startApp: true,
  }

  @args.string({ description: 'Editing job id' })
  declare editingJobId: string

  async run() {
    await new VideoEditingService().process(this.editingJobId)
    this.logger.info(`Video editing job processed: ${this.editingJobId}`)
  }
}
