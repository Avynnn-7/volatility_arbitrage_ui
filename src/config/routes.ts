/**
 * Application route definitions
 */

export const ROUTES = {
  HOME: '/',
  WIZARD: '/wizard',
  DASHBOARD: '/dashboard',
  ANALYSIS: '/analysis',
  ANALYSIS_LOCALVOL: '/analysis/localvol',
  ANALYSIS_COMPARISON: '/analysis/comparison',
  ANALYSIS_CERTIFICATE: '/analysis/certificate',
  EXPORT: '/export',
  SETTINGS: '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
