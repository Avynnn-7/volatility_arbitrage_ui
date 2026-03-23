/**
 * PDF Report Tables
 * Table components for @react-pdf/renderer documents
 */

import { View, Text } from '@react-pdf/renderer'
import { 
  styles, 
  colors, 
  formatPDFNumber, 
  formatPDFPercent,
  getSeverityColor,
} from './reportStyles'
import type { ArbitrageViolation } from '@/types/api.types'
import type { ReportSurfacePoint } from '@/types/report.types'

// ============================================================================
// Arbitrage Violations Table
// ============================================================================

interface ReportArbitrageTableProps {
  violations: ArbitrageViolation[]
  maxRows?: number
}

/**
 * Arbitrage violations table
 * Adapts to actual ArbitrageViolation type from api.types
 */
export function ReportArbitrageTable({ 
  violations, 
  maxRows = 20 
}: ReportArbitrageTableProps) {
  const displayViolations = violations.slice(0, maxRows)
  const hasMore = violations.length > maxRows

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableHeaderCell, flex: 0.8 }}>Type</Text>
        <Text style={styles.tableHeaderCell}>Strike</Text>
        <Text style={styles.tableHeaderCell}>Expiry</Text>
        <Text style={styles.tableHeaderCell}>Expiry 2</Text>
        <Text style={styles.tableHeaderCell}>Value</Text>
        <Text style={{ ...styles.tableHeaderCell, flex: 0.6 }}>Severity</Text>
      </View>

      {displayViolations.map((violation, index) => (
        <View 
          key={index} 
          style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
        >
          <Text style={{ ...styles.tableCell, flex: 0.8 }}>
            {violation.type === 'calendar' ? 'Calendar' : 'Butterfly'}
          </Text>
          <Text style={styles.tableCell}>
            {formatPDFNumber(violation.strike)}
          </Text>
          <Text style={styles.tableCell}>
            {formatPDFNumber(violation.expiry, 3)}
          </Text>
          <Text style={styles.tableCell}>
            {violation.expiry2 ? formatPDFNumber(violation.expiry2, 3) : '-'}
          </Text>
          <Text style={styles.tableCell}>
            {formatPDFPercent(violation.value)}
          </Text>
          <Text
            style={{
              ...styles.tableCell,
              flex: 0.6,
              color: getSeverityColor(violation.severity),
              fontWeight: 'bold',
            }}
          >
            {violation.severity.toUpperCase()}
          </Text>
        </View>
      ))}

      {hasMore && (
        <View style={styles.tableRow}>
          <Text 
            style={{ 
              ...styles.textSmall, 
              textAlign: 'center', 
              flex: 1, 
              paddingTop: 8 
            }}
          >
            ... and {violations.length - maxRows} more violations
          </Text>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// Surface Points Table
// ============================================================================

interface ReportSurfacePointsTableProps {
  points: ReportSurfacePoint[]
  maxRows?: number
}

/**
 * Surface points table with optional local vol comparison
 */
export function ReportSurfacePointsTable({ 
  points, 
  maxRows = 30 
}: ReportSurfacePointsTableProps) {
  const displayPoints = points.slice(0, maxRows)
  const hasMore = points.length > maxRows
  const hasLocalVol = points.some(p => p.localVol !== undefined)

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Strike</Text>
        <Text style={styles.tableHeaderCell}>Maturity</Text>
        <Text style={styles.tableHeaderCell}>Implied Vol</Text>
        {hasLocalVol && <Text style={styles.tableHeaderCell}>Local Vol</Text>}
        {hasLocalVol && <Text style={styles.tableHeaderCell}>Difference</Text>}
      </View>

      {displayPoints.map((point, index) => {
        const diff = point.localVol !== undefined
          ? point.localVol - point.impliedVol
          : undefined

        return (
          <View 
            key={index} 
            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={styles.tableCell}>
              {formatPDFNumber(point.strike)}
            </Text>
            <Text style={styles.tableCell}>
              {formatPDFNumber(point.maturity, 3)}
            </Text>
            <Text style={styles.tableCellHighlight}>
              {formatPDFPercent(point.impliedVol)}
            </Text>
            {hasLocalVol && (
              <Text style={styles.tableCell}>
                {point.localVol !== undefined 
                  ? formatPDFPercent(point.localVol) 
                  : '-'}
              </Text>
            )}
            {hasLocalVol && (
              <Text
                style={{
                  ...styles.tableCell,
                  color:
                    diff !== undefined
                      ? diff > 0
                        ? colors.success
                        : diff < 0
                        ? colors.danger
                        : colors.dark
                      : colors.dark,
                }}
              >
                {diff !== undefined
                  ? `${diff > 0 ? '+' : ''}${formatPDFPercent(diff)}`
                  : '-'}
              </Text>
            )}
          </View>
        )
      })}

      {hasMore && (
        <View style={styles.tableRow}>
          <Text 
            style={{ 
              ...styles.textSmall, 
              textAlign: 'center', 
              flex: 1, 
              paddingTop: 8 
            }}
          >
            ... and {points.length - maxRows} more points
          </Text>
        </View>
      )}
    </View>
  )
}

// ============================================================================
// Statistics Table
// ============================================================================

interface ReportStatisticsTableProps {
  stats: {
    minVol: number
    maxVol: number
    meanVol: number
    stdVol: number
  }
}

/**
 * Volatility statistics table
 */
export function ReportStatisticsTable({ stats }: ReportStatisticsTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Metric</Text>
        <Text style={styles.tableHeaderCell}>Min</Text>
        <Text style={styles.tableHeaderCell}>Max</Text>
        <Text style={styles.tableHeaderCell}>Mean</Text>
        <Text style={styles.tableHeaderCell}>Std Dev</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Implied Vol</Text>
        <Text style={styles.tableCell}>{formatPDFPercent(stats.minVol)}</Text>
        <Text style={styles.tableCell}>{formatPDFPercent(stats.maxVol)}</Text>
        <Text style={styles.tableCell}>{formatPDFPercent(stats.meanVol)}</Text>
        <Text style={styles.tableCell}>{formatPDFPercent(stats.stdVol)}</Text>
      </View>
    </View>
  )
}

// ============================================================================
// Violation Summary Table
// ============================================================================

interface ReportViolationSummaryTableProps {
  summary: {
    totalViolations: number
    butterflyViolations: number
    calendarViolations: number
    bySeverity: {
      low: number
      medium: number
      high: number
      critical: number
    }
  }
}

/**
 * Violation summary breakdown table
 */
export function ReportViolationSummaryTable({ 
  summary 
}: ReportViolationSummaryTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Category</Text>
        <Text style={styles.tableHeaderCell}>Count</Text>
        <Text style={styles.tableHeaderCell}>Percentage</Text>
      </View>
      
      {/* By Type */}
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Butterfly Violations</Text>
        <Text style={styles.tableCell}>{summary.butterflyViolations}</Text>
        <Text style={styles.tableCell}>
          {summary.totalViolations > 0 
            ? `${((summary.butterflyViolations / summary.totalViolations) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </View>
      <View style={styles.tableRowAlt}>
        <Text style={styles.tableCell}>Calendar Violations</Text>
        <Text style={styles.tableCell}>{summary.calendarViolations}</Text>
        <Text style={styles.tableCell}>
          {summary.totalViolations > 0 
            ? `${((summary.calendarViolations / summary.totalViolations) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </View>
      
      {/* By Severity */}
      <View style={styles.tableRow}>
        <Text style={{ ...styles.tableCell, color: colors.danger }}>Critical</Text>
        <Text style={styles.tableCell}>{summary.bySeverity.critical}</Text>
        <Text style={styles.tableCell}>
          {summary.totalViolations > 0 
            ? `${((summary.bySeverity.critical / summary.totalViolations) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </View>
      <View style={styles.tableRowAlt}>
        <Text style={{ ...styles.tableCell, color: '#DC2626' }}>High</Text>
        <Text style={styles.tableCell}>{summary.bySeverity.high}</Text>
        <Text style={styles.tableCell}>
          {summary.totalViolations > 0 
            ? `${((summary.bySeverity.high / summary.totalViolations) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={{ ...styles.tableCell, color: colors.warning }}>Medium</Text>
        <Text style={styles.tableCell}>{summary.bySeverity.medium}</Text>
        <Text style={styles.tableCell}>
          {summary.totalViolations > 0 
            ? `${((summary.bySeverity.medium / summary.totalViolations) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </View>
      <View style={styles.tableRowAlt}>
        <Text style={{ ...styles.tableCell, color: colors.success }}>Low</Text>
        <Text style={styles.tableCell}>{summary.bySeverity.low}</Text>
        <Text style={styles.tableCell}>
          {summary.totalViolations > 0 
            ? `${((summary.bySeverity.low / summary.totalViolations) * 100).toFixed(1)}%`
            : '0%'}
        </Text>
      </View>
    </View>
  )
}
