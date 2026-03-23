/**
 * PDF Report Sections
 * Reusable section components for @react-pdf/renderer documents
 */

import { View, Text } from '@react-pdf/renderer'
import { styles, getMetricStyle, formatPDFNumber, formatPDFPercent } from './reportStyles'
import type { AnalysisSummary, ReportGreeks } from '@/types/report.types'

// ============================================================================
// Metrics Section
// ============================================================================

interface ReportMetricsSectionProps {
  summary: AnalysisSummary
}

/**
 * Key metrics grid section
 */
export function ReportMetricsSection({ summary }: ReportMetricsSectionProps) {
  const metrics = [
    {
      label: 'ATM Implied Vol',
      value: formatPDFPercent(summary.atmImpliedVol),
      style: styles.metricValue,
    },
    {
      label: 'Vol of Vol',
      value: formatPDFPercent(summary.volOfVol),
      style: styles.metricValue,
    },
    {
      label: 'Skew (25Δ)',
      value: formatPDFPercent(summary.skew25Delta),
      style: getMetricStyle(summary.skew25Delta),
    },
    {
      label: 'Kurtosis',
      value: formatPDFNumber(summary.kurtosis, 3),
      style: styles.metricValue,
    },
    {
      label: 'Total Violations',
      value: summary.totalViolations.toString(),
      style: summary.totalViolations > 0 ? styles.metricValueNegative : styles.metricValuePositive,
    },
    {
      label: 'Calendar Violations',
      value: summary.calendarViolations.toString(),
      style: summary.calendarViolations > 0 ? styles.metricValueNegative : styles.metricValue,
    },
    {
      label: 'Butterfly Violations',
      value: summary.butterflyViolations.toString(),
      style: summary.butterflyViolations > 0 ? styles.metricValueNegative : styles.metricValue,
    },
    {
      label: 'Surface Quality',
      value: `${summary.surfaceQuality}%`,
      style: summary.surfaceQuality >= 90 ? styles.metricValuePositive : styles.metricValue,
    },
  ]

  return (
    <>
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={metric.style}>{metric.value}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

// ============================================================================
// Greeks Section
// ============================================================================

interface ReportGreeksSectionProps {
  greeks: ReportGreeks
}

/**
 * Greeks summary section
 */
export function ReportGreeksSection({ greeks }: ReportGreeksSectionProps) {
  const greekMetrics = [
    { 
      label: 'Delta (Δ)', 
      value: formatPDFNumber(greeks.delta, 4), 
      description: 'Price sensitivity' 
    },
    { 
      label: 'Gamma (Γ)', 
      value: formatPDFNumber(greeks.gamma, 4), 
      description: 'Delta sensitivity' 
    },
    { 
      label: 'Vega (ν)', 
      value: formatPDFNumber(greeks.vega, 4), 
      description: 'Vol sensitivity' 
    },
    { 
      label: 'Theta (Θ)', 
      value: formatPDFNumber(greeks.theta, 4), 
      description: 'Time decay' 
    },
    { 
      label: 'Rho (ρ)', 
      value: formatPDFNumber(greeks.rho, 4), 
      description: 'Rate sensitivity' 
    },
  ]

  return (
    <>
      <Text style={styles.sectionTitle}>Greeks Summary</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Greek</Text>
          <Text style={styles.tableHeaderCell}>Value</Text>
          <Text style={styles.tableHeaderCell}>Description</Text>
        </View>
        {greekMetrics.map((greek, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.tableCellHighlight}>{greek.label}</Text>
            <Text style={styles.tableCell}>{greek.value}</Text>
            <Text style={styles.tableCell}>{greek.description}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

// ============================================================================
// Parameters Section
// ============================================================================

interface ReportParametersSectionProps {
  parameters: {
    spotPrice: number
    riskFreeRate: number
    dividendYield: number
    strikeRange: [number, number]
    maturityRange: [number, number]
  }
}

/**
 * Analysis parameters section
 */
export function ReportParametersSection({ parameters }: ReportParametersSectionProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Analysis Parameters</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Parameter</Text>
          <Text style={styles.tableHeaderCell}>Value</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Spot Price</Text>
          <Text style={styles.tableCellHighlight}>
            ${formatPDFNumber(parameters.spotPrice, 2)}
          </Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={styles.tableCell}>Risk-Free Rate</Text>
          <Text style={styles.tableCell}>{formatPDFPercent(parameters.riskFreeRate)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Dividend Yield</Text>
          <Text style={styles.tableCell}>{formatPDFPercent(parameters.dividendYield)}</Text>
        </View>
        <View style={styles.tableRowAlt}>
          <Text style={styles.tableCell}>Strike Range</Text>
          <Text style={styles.tableCell}>
            ${formatPDFNumber(parameters.strikeRange[0])} - ${formatPDFNumber(parameters.strikeRange[1])}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Maturity Range</Text>
          <Text style={styles.tableCell}>
            {formatPDFNumber(parameters.maturityRange[0])}Y - {formatPDFNumber(parameters.maturityRange[1])}Y
          </Text>
        </View>
      </View>
    </>
  )
}

// ============================================================================
// Correction Results Section
// ============================================================================

interface ReportCorrectionSectionProps {
  results: {
    originalViolations: number
    remainingViolations: number
    maxAdjustment: number
    avgAdjustment: number
    totalPointsCorrected?: number
  }
}

/**
 * QP correction results section
 */
export function ReportCorrectionSection({ results }: ReportCorrectionSectionProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>QP Correction Results</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Original Violations</Text>
          <Text style={styles.metricValue}>
            {results.originalViolations}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Remaining Violations</Text>
          <Text style={results.remainingViolations === 0 ? styles.metricValuePositive : styles.metricValue}>
            {results.remainingViolations}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Max Adjustment</Text>
          <Text style={styles.metricValue}>
            {formatPDFPercent(results.maxAdjustment)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Adjustment</Text>
          <Text style={styles.metricValue}>
            {formatPDFPercent(results.avgAdjustment)}
          </Text>
        </View>
      </View>
    </>
  )
}
