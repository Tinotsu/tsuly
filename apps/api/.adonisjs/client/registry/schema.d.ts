/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.register': {
    methods: ["POST"]
    pattern: '/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/identity/validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#app/identity/validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['register']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/identity/validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#app/identity/validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['logout']>>>
    }
  }
  'auth.get_me': {
    methods: ["GET","HEAD"]
    pattern: '/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['getMe']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['getMe']>>>
    }
  }
  'billing.checkout': {
    methods: ["POST"]
    pattern: '/billing/checkout'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/billing/validators/billing.js').checkoutValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#app/billing/validators/billing.js').checkoutValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/billing/controllers/billing_controller').default['checkout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/billing/controllers/billing_controller').default['checkout']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'billing.portal': {
    methods: ["POST"]
    pattern: '/billing/portal'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/billing/controllers/billing_controller').default['portal']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/billing/controllers/billing_controller').default['portal']>>>
    }
  }
  'workspace.show': {
    methods: ["GET","HEAD"]
    pattern: '/content/workspace'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['show']>>>
    }
  }
  'workspace.create_idea': {
    methods: ["POST"]
    pattern: '/content/ideas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/content/validators/workspace').createIdeaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#app/content/validators/workspace').createIdeaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['createIdea']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['createIdea']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'workspace.update_idea': {
    methods: ["PATCH"]
    pattern: '/content/ideas/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/content/validators/workspace').updateIdeaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#app/content/validators/workspace').updateIdeaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['updateIdea']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['updateIdea']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'workspace.generate_script_from_idea': {
    methods: ["POST"]
    pattern: '/content/ideas/:id/script'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['generateScriptFromIdea']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['generateScriptFromIdea']>>>
    }
  }
  'workspace.update_video_script': {
    methods: ["PATCH"]
    pattern: '/content/videos/:id/script'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/content/validators/workspace').updateVideoScriptValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#app/content/validators/workspace').updateVideoScriptValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['updateVideoScript']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['updateVideoScript']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'workspace.chat_video_script': {
    methods: ["POST"]
    pattern: '/content/videos/:id/script/chat'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/content/validators/workspace').chatVideoScriptValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#app/content/validators/workspace').chatVideoScriptValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['chatVideoScript']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['chatVideoScript']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'workspace.update_brand_brain_field': {
    methods: ["PATCH"]
    pattern: '/content/brand-brain-fields/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/content/validators/workspace').updateBrandBrainFieldValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#app/content/validators/workspace').updateBrandBrainFieldValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['updateBrandBrainField']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['updateBrandBrainField']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'workspace.create_brand_brain_field': {
    methods: ["POST"]
    pattern: '/content/brand-brain-sections/:sectionId/fields'
    types: {
      body: ExtractBody<InferInput<(typeof import('#app/content/validators/workspace').createBrandBrainFieldValidator)>>
      paramsTuple: [ParamValue]
      params: { sectionId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#app/content/validators/workspace').createBrandBrainFieldValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['createBrandBrainField']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/content/controllers/workspace_controller').default['createBrandBrainField']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'billing.webhook': {
    methods: ["POST"]
    pattern: '/billing/webhook'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/billing/controllers/billing_controller').default['webhook']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/billing/controllers/billing_controller').default['webhook']>>>
    }
  }
  'auth.is_authenticated': {
    methods: ["GET","HEAD"]
    pattern: '/is-authenticated'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['isAuthenticated']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/identity/controllers/auth_controller').default['isAuthenticated']>>>
    }
  }
  'health_checks': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/core/controllers/health_checks_controller').default['handle']>>>
    }
  }
}
