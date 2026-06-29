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
    updateBrandBrainField: typeof routes['workspace.update_brand_brain_field']
    createBrandBrainField: typeof routes['workspace.create_brand_brain_field']
  }
  healthChecks: typeof routes['health_checks']
}
