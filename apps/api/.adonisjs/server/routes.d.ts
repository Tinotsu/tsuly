import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.get_me': { paramsTuple?: []; params?: {} }
    'billing.checkout': { paramsTuple?: []; params?: {} }
    'billing.portal': { paramsTuple?: []; params?: {} }
    'workspace.show': { paramsTuple?: []; params?: {} }
    'workspace.create_idea': { paramsTuple?: []; params?: {} }
    'workspace.update_idea': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.generate_script_from_idea': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.update_video_script': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.chat_video_script': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.upload_recording': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.download_final_video': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.delete_recording': { paramsTuple: [ParamValue,ParamValue]; params: {'videoId': ParamValue,'recordingId': ParamValue} }
    'workspace.update_brand_brain_field': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.create_brand_brain_field': { paramsTuple: [ParamValue]; params: {'sectionId': ParamValue} }
    'billing.webhook': { paramsTuple?: []; params?: {} }
    'auth.is_authenticated': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'billing.checkout': { paramsTuple?: []; params?: {} }
    'billing.portal': { paramsTuple?: []; params?: {} }
    'workspace.create_idea': { paramsTuple?: []; params?: {} }
    'workspace.generate_script_from_idea': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.chat_video_script': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.upload_recording': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.create_brand_brain_field': { paramsTuple: [ParamValue]; params: {'sectionId': ParamValue} }
    'billing.webhook': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.get_me': { paramsTuple?: []; params?: {} }
    'workspace.show': { paramsTuple?: []; params?: {} }
    'workspace.download_final_video': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.is_authenticated': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.get_me': { paramsTuple?: []; params?: {} }
    'workspace.show': { paramsTuple?: []; params?: {} }
    'workspace.download_final_video': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.is_authenticated': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'workspace.update_idea': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.update_video_script': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'workspace.update_brand_brain_field': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'workspace.delete_recording': { paramsTuple: [ParamValue,ParamValue]; params: {'videoId': ParamValue,'recordingId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}