/**
 * Report Builder Component
 * UI for configuring and generating PDF reports
 */

import { useState, useCallback } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './card'
import { Button } from './button'
import { Label } from './label'
import { Input } from './input'
import { Switch } from './switch'
import { Progress } from './progress'
import { usePDFGeneration, useBuildReport } from '@/hooks/usePDFGeneration'
import { useAppSelector } from '@/store/hooks'
import { FileText, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { CorrectionResults } from '@/types/report.types'

// ============================================================================
// Report Builder Component
// ============================================================================

export function ReportBuilder() {
  const { generatePDF, isGenerating, progress, error } = usePDFGeneration()
  const { buildReport } = useBuildReport()

  // Get data from store - using actual slice structure
  const currentSurface = useAppSelector((state) => state.surface.currentSurface)
  const detectionResult = useAppSelector((state) => state.arbitrage.detectionResult)
  const correctionResult = useAppSelector((state) => state.arbitrage.correctionResult)

  // Report options state
  const [underlying, setUnderlying] = useState('SPX')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeLocalVol, setIncludeLocalVol] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  // Derive violations from detection result
  const violations = detectionResult?.violations ?? []
  
  // Get spot price from surface data
  const spotPrice = currentSurface?.marketData?.spot ?? 100

  // Convert correction result to report format
  const corrections: CorrectionResults | null = correctionResult
    ? {
        originalViolations: detectionResult?.violations?.length ?? 0,
        remainingViolations: 0, // Would need verification result
        maxAdjustment: correctionResult.maxCorrection,
        avgAdjustment: correctionResult.avgCorrection,
        totalPointsCorrected: 0, // Not available in current type
      }
    : null

  /**
   * Handle report generation
   */
  const handleGenerate = useCallback(async () => {
    if (!currentSurface) {
      return
    }

    setShowSuccess(false)

    const report = buildReport(
      currentSurface,
      violations,
      corrections,
      { 
        underlying, 
        spotPrice,
        dataDate: currentSurface.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      }
    )

    await generatePDF(report, { includeCharts, includeLocalVol })
    
    if (!error) {
      setShowSuccess(true)
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [
    currentSurface,
    violations,
    corrections,
    underlying,
    spotPrice,
    includeCharts,
    includeLocalVol,
    buildReport,
    generatePDF,
    error,
  ])

  // Check if we can generate
  const canGenerate = currentSurface !== null && !isGenerating

  // Calculate data point count
  const dataPointCount = currentSurface?.ivGrid
    ? currentSurface.ivGrid.flat().length
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate PDF Report
        </CardTitle>
        <CardDescription>
          Create a comprehensive analysis report in PDF format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          {/* Underlying Symbol */}
          <div className="space-y-2">
            <Label htmlFor="underlying">Underlying Symbol</Label>
            <Input
              id="underlying"
              value={underlying}
              onChange={(e) => setUnderlying(e.target.value)}
              placeholder="e.g., SPX, AAPL, TSLA"
              disabled={isGenerating}
            />
          </div>

          {/* Include Charts Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Include Charts</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Capture and embed visualization screenshots
              </p>
            </div>
            <Switch 
              checked={includeCharts} 
              onCheckedChange={setIncludeCharts}
              disabled={isGenerating}
            />
          </div>

          {/* Include Local Vol Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Include Local Volatility</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add local vol calculations and comparison
              </p>
            </div>
            <Switch 
              checked={includeLocalVol} 
              onCheckedChange={setIncludeLocalVol}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating report...
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {progress < 55 
                ? 'Capturing charts...'
                : progress < 80
                ? 'Creating document...'
                : progress < 95
                ? 'Generating PDF...'
                : 'Preparing download...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Success indicator */}
        {showSuccess && !isGenerating && !error && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-600 dark:text-green-400">
              Report generated successfully!
            </span>
          </div>
        )}

        {/* Surface Info */}
        {currentSurface && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
            <p className="text-sm font-medium">Surface Data Summary</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>Data Points: {dataPointCount}</span>
              <span>Strikes: {currentSurface.strikes?.length ?? 0}</span>
              <span>Maturities: {currentSurface.expiries?.length ?? 0}</span>
              <span>Violations: {violations.length}</span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate &amp; Download PDF
            </>
          )}
        </Button>

        {/* Help Text */}
        {!currentSurface ? (
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Load volatility surface data first to generate a report
          </p>
        ) : (
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Report will include {dataPointCount} data points
            {violations.length > 0 && ` and ${violations.length} violations`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default ReportBuilder
