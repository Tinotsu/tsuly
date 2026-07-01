/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    logout: typeof routes['auth.logout']
    getMe: typeof routes['auth.get_me']
    isAuthenticated: typeof routes['auth.is_authenticated']
  }
  billing: {
    checkout: typeof routes['billing.checkout']
    portal: typeof routes['billing.portal']
    webhook: typeof routes['billing.webhook']
  }
  workspace: {
    show: typeof routes['workspace.show']
    createIdea: typeof routes['workspace.create_idea']
    updateIdea: typeof routes['workspace.update_idea']
    deleteIdea: typeof routes['workspace.delete_idea']
    generateScriptFromIdea: typeof routes['workspace.generate_script_from_idea']
    createVideo: typeof routes['workspace.create_video']
    deleteVideo: typeof routes['workspace.delete_video']
    updateVideoScript: typeof routes['workspace.update_video_script']
    chatVideoScript: typeof routes['workspace.chat_video_script']
    uploadRecording: typeof routes['workspace.upload_recording']
    downloadFinalVideo: typeof routes['workspace.download_final_video']
    deleteRecording: typeof routes['workspace.delete_recording']
    updateBrandBrainField: typeof routes['workspace.update_brand_brain_field']
    deleteBrandBrainField: typeof routes['workspace.delete_brand_brain_field']
    createBrandBrainField: typeof routes['workspace.create_brand_brain_field']
  }
  healthChecks: typeof routes['health_checks']
}
