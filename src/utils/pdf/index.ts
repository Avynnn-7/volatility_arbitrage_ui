/**
 * PDF Report Utilities
 * Barrel export for all PDF-related utilities
 */

// Document components
export { ReportDocument } from './ReportDocument'

// Section components
export { 
  ReportMetricsSection, 
  ReportGreeksSection, 
  ReportParametersSection,
  ReportCorrectionSection,
} from './ReportSections'

// Table components
export { 
  ReportArbitrageTable, 
  ReportSurfacePointsTable,
  ReportStatisticsTable,
  ReportViolationSummaryTable,
} from './ReportTables'

// Styles and utilities
export {
  styles,
  colors,
  formatPDFNumber,
  formatPDFPercent,
  formatPDFCurrency,
  getMetricStyle,
  getSeverityColor,
} from './reportStyles'
