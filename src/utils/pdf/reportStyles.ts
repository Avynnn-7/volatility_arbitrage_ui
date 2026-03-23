/**
 * PDF Report Styles
 * Defines styles and color palette for @react-pdf/renderer documents
 */

import { StyleSheet } from '@react-pdf/renderer'

// ============================================================================
// Color Palette
// ============================================================================

/**
 * Color palette for PDF reports
 */
export const colors = {
  // Brand colors
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Neutral colors
  dark: '#1E293B',
  medium: '#64748B',
  light: '#F1F5F9',
  white: '#FFFFFF',
  border: '#E2E8F0',
} as const

// ============================================================================
// Main Styles
// ============================================================================

/**
 * Main stylesheet for PDF reports
 */
export const styles = StyleSheet.create({
  // ========================================
  // Page Layouts
  // ========================================
  
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  
  // ========================================
  // Header
  // ========================================
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  
  headerMeta: {
    alignItems: 'flex-end',
  },
  
  headerDate: {
    fontSize: 10,
    color: colors.medium,
  },
  
  // ========================================
  // Titles
  // ========================================
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 14,
    color: colors.medium,
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // ========================================
  // Text Styles
  // ========================================
  
  text: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },
  
  textSmall: {
    fontSize: 8,
    color: colors.medium,
  },
  
  textBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
  },
  
  // ========================================
  // Metrics Grid
  // ========================================
  
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  
  metricCard: {
    width: '23%',
    padding: 12,
    backgroundColor: colors.light,
    borderRadius: 4,
  },
  
  metricLabel: {
    fontSize: 8,
    color: colors.medium,
    marginBottom: 4,
  },
  
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  
  metricValuePositive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  
  metricValueNegative: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  
  // ========================================
  // Tables
  // ========================================
  
  table: {
    width: '100%',
    marginBottom: 20,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    padding: 8,
  },
  
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 6,
  },
  
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 6,
    backgroundColor: colors.light,
  },
  
  tableCell: {
    fontSize: 9,
    color: colors.dark,
    flex: 1,
    textAlign: 'center',
  },
  
  tableCellHighlight: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  
  // ========================================
  // Charts
  // ========================================
  
  chartContainer: {
    height: 200,
    marginBottom: 20,
    backgroundColor: colors.light,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  chartImage: {
    width: '100%',
    height: 200,
    objectFit: 'contain',
  },
  
  // ========================================
  // Footer
  // ========================================
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  
  footerText: {
    fontSize: 8,
    color: colors.medium,
  },
  
  pageNumber: {
    fontSize: 8,
    color: colors.medium,
  },
  
  // ========================================
  // Status Badges
  // ========================================
  
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  
  statusArbitrage: {
    backgroundColor: colors.danger,
    color: colors.white,
  },
  
  statusClean: {
    backgroundColor: colors.success,
    color: colors.white,
  },
  
  // ========================================
  // Callout Boxes
  // ========================================
  
  calloutInfo: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  
  calloutWarning: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 16,
  },
  
  calloutDanger: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    marginBottom: 16,
  },
  
  calloutSuccess: {
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: 16,
  },
})

// ============================================================================
// Utility Functions
// ============================================================================

// Style type for metric values
type MetricValueStyle = {
  fontSize: number
  fontWeight: string
  color: string
}

/**
 * Get appropriate metric style based on value sign
 */
export function getMetricStyle(value: number): MetricValueStyle {
  if (value > 0) return styles.metricValuePositive as MetricValueStyle
  if (value < 0) return styles.metricValueNegative as MetricValueStyle
  return styles.metricValue as MetricValueStyle
}

/**
 * Format number for PDF display
 */
export function formatPDFNumber(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return 'N/A'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format percentage for PDF display
 */
export function formatPDFPercent(value: number): string {
  if (!isFinite(value)) return 'N/A'
  return `${(value * 100).toFixed(2)}%`
}

/**
 * Format currency for PDF display
 */
export function formatPDFCurrency(value: number): string {
  if (!isFinite(value)) return 'N/A'
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return colors.danger
    case 'high':
      return '#DC2626' // red-600
    case 'medium':
      return colors.warning
    case 'low':
      return colors.success
    default:
      return colors.medium
  }
}
