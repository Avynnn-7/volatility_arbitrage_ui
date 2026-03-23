import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  HealthCheckResponse,
  CreateSurfaceRequest,
  SurfaceData,
  DetectArbitrageRequest,
  ArbitrageDetectionResult,
  CorrectArbitrageRequest,
  CorrectionResponse,
  LocalVolRequest,
  LocalVolSurface,
  DualCertificateRequest,
  DualCertificate,
} from '@/types'
import { API_BASE_URL } from '@/config'

/**
 * Vol-Arb API slice using RTK Query
 * Provides automatic caching, request deduplication, and loading states
 */
export const volArbApi = createApi({
  reducerPath: 'volArbApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Surface', 'Arbitrage', 'LocalVol', 'Certificate'],
  endpoints: (builder) => ({
    // ========================================================================
    // Health Check
    // ========================================================================
    
    /**
     * Check API server health
     */
    healthCheck: builder.query<HealthCheckResponse, void>({
      query: () => '/health',
    }),

    // ========================================================================
    // Surface Endpoints
    // ========================================================================
    
    /**
     * Create a new volatility surface from quotes
     */
    createSurface: builder.mutation<SurfaceData, CreateSurfaceRequest>({
      query: (body) => ({
        url: '/surface',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Surface'],
    }),

    /**
     * Get a surface by ID
     */
    getSurface: builder.query<SurfaceData, string>({
      query: (id) => `/surface/${id}`,
      providesTags: (result) => 
        result ? [{ type: 'Surface', id: result.id }] : [],
    }),

    // ========================================================================
    // Arbitrage Endpoints
    // ========================================================================
    
    /**
     * Detect arbitrage violations in a surface
     */
    detectArbitrage: builder.mutation<ArbitrageDetectionResult, DetectArbitrageRequest>({
      query: (body) => ({
        url: '/arbitrage/detect',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Arbitrage'],
    }),

    /**
     * Apply QP correction to remove arbitrage
     */
    correctArbitrage: builder.mutation<CorrectionResponse, CorrectArbitrageRequest>({
      query: (body) => ({
        url: '/arbitrage/correct',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Surface', 'Arbitrage'],
    }),

    // ========================================================================
    // Analysis Endpoints
    // ========================================================================
    
    /**
     * Compute local volatility surface
     */
    computeLocalVol: builder.mutation<LocalVolSurface, LocalVolRequest>({
      query: (body) => ({
        url: '/localvol',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LocalVol'],
    }),

    /**
     * Generate dual certificate (KKT verification)
     */
    generateCertificate: builder.mutation<DualCertificate, DualCertificateRequest>({
      query: (body) => ({
        url: '/certificate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Certificate'],
    }),

    // ========================================================================
    // Export Endpoints
    // ========================================================================
    
    /**
     * Export surface as JSON
     */
    exportJson: builder.mutation<Blob, { surfaceId: string; includeCorrected?: boolean }>({
      query: ({ surfaceId, includeCorrected }) => ({
        url: '/export/json',
        method: 'POST',
        body: { surfaceId, includeCorrected },
        responseHandler: (response) => response.blob(),
      }),
    }),

    /**
     * Export surface as CSV
     */
    exportCsv: builder.mutation<Blob, { surfaceId: string; includeCorrected?: boolean }>({
      query: ({ surfaceId, includeCorrected }) => ({
        url: '/export/csv',
        method: 'POST',
        body: { surfaceId, includeCorrected },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

// Export hooks for usage in components
export const {
  // Queries
  useHealthCheckQuery,
  useGetSurfaceQuery,
  useLazyGetSurfaceQuery,
  
  // Mutations
  useCreateSurfaceMutation,
  useDetectArbitrageMutation,
  useCorrectArbitrageMutation,
  useComputeLocalVolMutation,
  useGenerateCertificateMutation,
  useExportJsonMutation,
  useExportCsvMutation,
} = volArbApi
