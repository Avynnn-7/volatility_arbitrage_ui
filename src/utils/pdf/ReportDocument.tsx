/**
 * PDF Report Document
 * Main document component for @react-pdf/renderer
 * Generates a multi-page analysis report
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
} from '@react-pdf/renderer'
import { styles, colors, formatPDFNumber } from './reportStyles'
import { ReportMetricsSection, ReportCorrectionSection } from './ReportSections'
import { ReportArbitrageTable, ReportStatisticsTable } from './ReportTables'
import type { AnalysisReport, ReportChartImages } from '@/types/report.types'

// ============================================================================
// Report Document Props
// ============================================================================

interface ReportDocumentProps {
  /** Report data */
  report: AnalysisReport
  /** Chart images (base64 data URLs) */
  chartImages?: ReportChartImages
}

// ============================================================================
// Footer Component
// ============================================================================

function ReportFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Vol-Arb Analysis System | Confidential
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}

// ============================================================================
// Main Report Document
// ============================================================================

/**
 * Main PDF report document
 * Generates a comprehensive volatility analysis report
 */
export function ReportDocument({ report, chartImages }: ReportDocumentProps) {
  const {
    metadata,
    summary,
    arbitrageViolations,
    correctionResults,
    surfaceStats,
  } = report

  // Format generated date
  const generatedDate = new Date(metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Document>
      {/* ================================================================== */}
      {/* Cover Page */}
      {/* ================================================================== */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Vol-Arb Analysis</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerDate}>{generatedDate}</Text>
            <Text style={styles.headerDate}>Report ID: {metadata.reportId}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Volatility Surface Analysis Report</Text>
        <Text style={styles.subtitle}>
          {metadata.underlying} | Spot: {formatPDFNumber(metadata.spotPrice)} |
          Data Date: {metadata.dataDate}
        </Text>

        {/* Executive Summary */}
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.calloutInfo}>
          <Text style={styles.text}>
            This report presents a comprehensive analysis of the implied volatility surface
            for {metadata.underlying}. The analysis includes arbitrage detection,
            QP correction results, and surface quality metrics.
          </Text>
        </View>

        {/* Key Metrics */}
        <ReportMetricsSection summary={summary} />

        {/* Arbitrage Status */}
        <Text style={styles.sectionTitle}>Arbitrage Detection Status</Text>
        {summary.totalViolations > 0 ? (
          <View style={styles.calloutDanger}>
            <Text style={styles.textBold}>
              {summary.totalViolations} arbitrage violation(s) detected
            </Text>
            <Text style={styles.text}>
              Calendar spread violations: {summary.calendarViolations} |
              Butterfly violations: {summary.butterflyViolations}
            </Text>
          </View>
        ) : (
          <View style={{ ...styles.calloutInfo, borderLeftColor: colors.success }}>
            <Text style={styles.textBold}>No arbitrage violations detected</Text>
            <Text style={styles.text}>
              The volatility surface is arbitrage-free.
            </Text>
          </View>
        )}

        <ReportFooter />
      </Page>

      {/* ================================================================== */}
      {/* Arbitrage Details Page (if violations exist) */}
      {/* ================================================================== */}
      {arbitrageViolations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Arbitrage Violations Detail</Text>
          <ReportArbitrageTable violations={arbitrageViolations} />

          {/* Correction Results */}
          {correctionResults && (
            <ReportCorrectionSection results={correctionResults} />
          )}

          <ReportFooter />
        </Page>
      )}

      {/* ================================================================== */}
      {/* Charts Page */}
      {/* ================================================================== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Volatility Surface Visualization</Text>

        {chartImages?.volatilitySurface ? (
          <Image src={chartImages.volatilitySurface} style={styles.chartImage} />
        ) : (
          <View style={styles.chartContainer}>
            <Text style={styles.textSmall}>3D Surface chart not available</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Volatility Smile</Text>
        {chartImages?.smileChart ? (
          <Image src={chartImages.smileChart} style={styles.chartImage} />
        ) : (
          <View style={styles.chartContainer}>
            <Text style={styles.textSmall}>Smile chart not available</Text>
          </View>
        )}

        <ReportFooter />
      </Page>

      {/* ================================================================== */}
      {/* Surface Statistics Page */}
      {/* ================================================================== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Surface Statistics</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Points</Text>
            <Text style={styles.metricValue}>{surfaceStats.totalPoints}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Strikes</Text>
            <Text style={styles.metricValue}>{surfaceStats.uniqueStrikes}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Maturities</Text>
            <Text style={styles.metricValue}>{surfaceStats.uniqueMaturities}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Data Quality</Text>
            <Text style={styles.metricValue}>{surfaceStats.dataQuality}%</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Volatility Range</Text>
        <ReportStatisticsTable stats={surfaceStats} />

        {/* Term Structure */}
        <Text style={styles.sectionTitle}>Term Structure (ATM)</Text>
        {chartImages?.termStructure ? (
          <Image src={chartImages.termStructure} style={styles.chartImage} />
        ) : (
          <View style={styles.chartContainer}>
            <Text style={styles.textSmall}>Term structure chart not available</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.calloutWarning}>
          <Text style={styles.textSmall}>
            DISCLAIMER: This report is for informational purposes only and does not
            constitute financial advice. Past performance does not guarantee future results.
            The analysis is based on market data as of the report date and may not reflect
            current market conditions.
          </Text>
        </View>

        <ReportFooter />
      </Page>
    </Document>
  )
}

export default ReportDocument
