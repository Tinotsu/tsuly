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
    'billing.webhook': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.get_me': { paramsTuple?: []; params?: {} }
    'workspace.show': { paramsTuple?: []; params?: {} }
    'auth.is_authenticated': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.get_me': { paramsTuple?: []; params?: {} }
    'workspace.show': { paramsTuple?: []; params?: {} }
    'auth.is_authenticated': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}