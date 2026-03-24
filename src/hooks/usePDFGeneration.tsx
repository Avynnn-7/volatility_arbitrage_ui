/**
 * PDF Generation Hooks
 * Hooks for generating and downloading PDF reports
 */

import { useState, useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import html2canvas from 'html2canvas'
import { ReportDocument } from '@/utils/pdf/ReportDocument'
import type { 
  AnalysisReport, 
  ReportGenerationOptions, 
  ReportChartImages,
  AnalysisSummary,
  SurfaceStatistics,
  CorrectionResults,
} from '@/types/report.types'
import type { ArbitrageViolation, SurfaceData } from '@/types/api.types'

// ============================================================================
// Types
// ============================================================================

interface UsePDFGenerationReturn {
  /** Generate and download PDF report */
  generatePDF: (
    report: AnalysisReport,
    options?: Partial<ReportGenerationOptions>
  ) => Promise<void>
  /** Capture a DOM element as base64 image */
  captureChart: (elementId: string) => Promise<string | null>
  /** Whether PDF is currently being generated */
  isGenerating: boolean
  /** Generation progress (0-100) */
  progress: number
  /** Error message if generation failed */
  error: string | null
}

// ============================================================================
// Default Options
// ============================================================================

const defaultOptions: ReportGenerationOptions = {
  includeCharts: true,
  includeLocalVol: true,
  includeGreeks: true,
  maxViolationsToShow: 20,
  maxPointsToShow: 50,
}

// ============================================================================
// usePDFGeneration Hook
// ============================================================================

/**
 * Hook for PDF report generation
 * Handles chart capture, document creation, and download
 */
export function usePDFGeneration(): UsePDFGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Capture a chart element as a base64 image
   */
  const captureChart = useCallback(async (elementId: string): Promise<string | null> => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        console.warn(`Element with id "${elementId}" not found`)
        return null
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution for PDF
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      return canvas.toDataURL('image/png')
    } catch (err) {
      console.error(`Failed to capture chart ${elementId}:`, err)
      return null
    }
  }, [])

  /**
   * Generate and download PDF report
   */
  const generatePDF = useCallback(
    async (
      report: AnalysisReport,
      options: Partial<ReportGenerationOptions> = {}
    ): Promise<void> => {
      const mergedOptions = { ...defaultOptions, ...options }

      setIsGenerating(true)
      setProgress(0)
      setError(null)

      try {
        // Step 1: Capture charts if requested
        const chartImages: ReportChartImages = {}

        if (mergedOptions.includeCharts) {
          setProgress(10)

          // Capture volatility surface (3D canvas)
          const surfaceImage = await captureChart('volatility-surface-3d')
          if (surfaceImage) chartImages.volatilitySurface = surfaceImage
          setProgress(25)

          // Capture smile chart
          const smileImage = await captureChart('volatility-smile-chart')
          if (smileImage) chartImages.smileChart = smileImage
          setProgress(40)

          // Capture term structure
          const termImage = await captureChart('term-structure-chart')
          if (termImage) chartImages.termStructure = termImage
          setProgress(55)
        }

        // Step 2: Create PDF document
        setProgress(65)
        const doc = <ReportDocument report={report} chartImages={chartImages} />

        // Step 3: Generate PDF blob
        setProgress(80)
        const blob = await pdf(doc).toBlob()

        // Step 4: Create download link
        setProgress(95)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `volatility_analysis_${report.metadata.reportId}_${
          new Date().toISOString().slice(0, 10)
        }.pdf`

        // Step 5: Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Cleanup
        URL.revokeObjectURL(url)
        setProgress(100)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate PDF'
        setError(message)
        console.error('PDF generation error:', err)
      } finally {
        setIsGenerating(false)
      }
    },
    [captureChart]
  )

  return {
    generatePDF,
    captureChart,
    isGenerating,
    progress,
    error,
  }
}

// ============================================================================
// useBuildReport Hook
// ============================================================================

interface UseBuildReportReturn {
  /** Build report data from surface and violation data */
  buildReport: (
    surfaceData: SurfaceData | null,
    violations: ArbitrageViolation[],
    corrections: CorrectionResults | null,
    metadata: Partial<AnalysisReport['metadata']>
  ) => AnalysisReport
}

/**
 * Hook for building report data from current state
 */
export function useBuildReport(): UseBuildReportReturn {
  const buildReport = useCallback(
    (
      surfaceData: SurfaceData | null,
      violations: ArbitrageViolation[],
      corrections: CorrectionResults | null,
      metadata: Partial<AnalysisReport['metadata']>
    ): AnalysisReport => {
      // Extract volatility data from surface
      const vols: number[] = []
      if (surfaceData?.ivGrid) {
        for (const row of surfaceData.ivGrid) {
          for (const iv of row) {
            if (isFinite(iv)) vols.push(iv)
          }
        }
      }

      // Calculate statistics
      const meanVol = vols.length > 0
        ? vols.reduce((a, b) => a + b, 0) / vols.length
        : 0
      
      const stdVol = vols.length > 0
        ? Math.sqrt(
            vols.reduce((sum, v) => sum + (v - meanVol) ** 2, 0) / vols.length
          )
        : 0

      const minVol = vols.length > 0 ? Math.min(...vols) : 0
      const maxVol = vols.length > 0 ? Math.max(...vols) : 0

      // Count violations by type
      const calendarViolations = violations.filter(v => v.type === 'calendar').length
      const butterflyViolations = violations.filter(v => v.type === 'butterfly').length

      // Calculate ATM vol (closest to spot)
      let atmVol = meanVol
      if (surfaceData?.stats?.atmIV) {
        atmVol = surfaceData.stats.atmIV
      }

      // Build summary
      const summary: AnalysisSummary = {
        atmImpliedVol: atmVol,
        volOfVol: stdVol,
        skew25Delta: 0, // Would need delta calculation
        kurtosis: 0, // Would need higher moment calculation
        totalViolations: violations.length,
        calendarViolations,
        butterflyViolations,
        surfaceQuality: Math.round(
          (1 - violations.length / Math.max(1, vols.length)) * 100
        ),
      }

      // Build surface stats
      const surfaceStats: SurfaceStatistics = {
        totalPoints: vols.length,
        uniqueStrikes: surfaceData?.strikes?.length ?? 0,
        uniqueMaturities: surfaceData?.expiries?.length ?? 0,
        dataQuality: 95, // Placeholder - would need actual quality metrics
        minVol,
        maxVol,
        meanVol,
        stdVol,
      }

      // Build strike and maturity ranges
      const strikes = surfaceData?.strikes ?? [80, 120]
      const maturities = surfaceData?.expiries ?? [0.1, 2]

      return {
        metadata: {
          reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
          generatedAt: new Date().toISOString(),
          underlying: metadata.underlying ?? 'Unknown',
          spotPrice: metadata.spotPrice ?? surfaceData?.marketData?.spot ?? 100,
          dataDate: metadata.dataDate ?? new Date().toISOString().slice(0, 10),
          version: '1.0.0',
          ...metadata,
        },
        summary,
        arbitrageViolations: violations,
        correctionResults: corrections ?? undefined,
        surfaceStats,
        parameters: {
          spotPrice: metadata.spotPrice ?? surfaceData?.marketData?.spot ?? 100,
          riskFreeRate: surfaceData?.marketData?.riskFreeRate ?? 0.05,
          dividendYield: surfaceData?.marketData?.dividendYield ?? 0.02,
          strikeRange: [Math.min(...strikes), Math.max(...strikes)],
          maturityRange: [Math.min(...maturities), Math.max(...maturities)],
        },
      }
    },
    []
  )

  return { buildReport }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique report ID
 */
export function generateReportId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RPT-${timestamp}-${random}`
}

/**
 * Format report filename
 */
export function formatReportFilename(
  underlying: string,
  reportId: string,
  date: Date = new Date()
): string {
  const dateStr = date.toISOString().slice(0, 10)
  const sanitizedUnderlying = underlying.replace(/[^a-zA-Z0-9]/g, '_')
  return `volatility_analysis_${sanitizedUnderlying}_${reportId}_${dateStr}.pdf`
}
