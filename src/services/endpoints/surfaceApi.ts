/**
 * Surface API endpoints (standalone, non-RTK Query version)
 * Use these for one-off requests or when RTK Query is not suitable
 */

import { apiPost, apiGet, apiDownload } from '../api'
import type {
  CreateSurfaceRequest,
  SurfaceData,
  LocalVolSurface,
  LocalVolRequest,
} from '@/types'

/**
 * Create a new volatility surface
 */
export async function createSurface(request: CreateSurfaceRequest): Promise<SurfaceData> {
  return apiPost<SurfaceData>('/surface', request)
}

/**
 * Get a surface by ID
 */
export async function getSurface(id: string): Promise<SurfaceData> {
  return apiGet<SurfaceData>(`/surface/${id}`)
}

/**
 * Compute local volatility surface
 */
export async function computeLocalVol(request: LocalVolRequest): Promise<LocalVolSurface> {
  return apiPost<LocalVolSurface>('/localvol', request)
}

/**
 * Export surface as JSON file
 */
export async function exportSurfaceJson(
  surfaceId: string,
  includeCorrected = true
): Promise<void> {
  const filename = `vol_surface_${surfaceId}.json`
  await apiDownload('/export/json', { surfaceId, includeCorrected }, filename)
}

/**
 * Export surface as CSV file
 */
export async function exportSurfaceCsv(
  surfaceId: string,
  includeCorrected = true
): Promise<void> {
  const filename = `vol_surface_${surfaceId}.csv`
  await apiDownload('/export/csv', { surfaceId, includeCorrected }, filename)
}
