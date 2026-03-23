/**
 * Virtualized Table Component
 * High-performance table with row virtualization using @tanstack/react-virtual
 */

import { useRef, useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/utils/cn'

// ============================================================================
// Types
// ============================================================================

/**
 * Column definition for virtualized table
 */
export interface Column<T> {
  /** Unique key for the column - can be a property path like 'user.name' */
  key: keyof T | string
  /** Column header text */
  header: string
  /** Fixed width in pixels (default: 100) */
  width?: number
  /** Custom render function for cell content */
  render?: (value: unknown, row: T, index: number) => React.ReactNode
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Whether column is sortable */
  sortable?: boolean
}

/**
 * Props for VirtualizedTable component
 */
export interface VirtualizedTableProps<T> {
  /** Data array to display */
  data: T[]
  /** Column definitions */
  columns: Column<T>[]
  /** Height of each row in pixels (default: 40) */
  rowHeight?: number
  /** Maximum height of the table body (default: 500) */
  maxHeight?: number
  /** Additional CSS class */
  className?: string
  /** Callback when row is clicked */
  onRowClick?: (row: T, index: number) => void
  /** Index of currently selected row */
  selectedIndex?: number
  /** Whether header should be sticky (default: true) */
  stickyHeader?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Loading state */
  isLoading?: boolean
  /** Number of overscan rows (default: 10) */
  overscan?: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

// ============================================================================
// VirtualizedTable Component
// ============================================================================

/**
 * High-performance virtualized table component
 * Renders only visible rows for optimal performance with large datasets
 */
export function VirtualizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 40,
  maxHeight = 500,
  className,
  onRowClick,
  selectedIndex,
  stickyHeader = true,
  emptyMessage = 'No data available',
  isLoading = false,
  overscan = 10,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Initialize virtualizer
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  // Get cell value - handles nested paths
  const getCellValue = useCallback(
    (row: T, column: Column<T>): unknown => {
      const key = column.key as string
      return key.includes('.') ? getNestedValue(row, key) : row[key]
    },
    []
  )

  // Calculate total width
  const totalWidth = useMemo(
    () => columns.reduce((sum, col) => sum + (col.width ?? 100), 0),
    [columns]
  )

  // Virtual items
  const virtualRows = rowVirtualizer.getVirtualItems()

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex bg-slate-100 dark:bg-slate-800 border-b h-10">
            {columns.map((col, i) => (
              <div
                key={i}
                className="px-3 py-2"
                style={{ width: col.width ?? 100 }}
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
          {/* Row skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex border-b border-slate-100 dark:border-slate-800 h-10">
              {columns.map((col, j) => (
                <div
                  key={j}
                  className="px-3 py-2"
                  style={{ width: col.width ?? 100 }}
                >
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        {/* Header */}
        <div
          className="flex bg-slate-100 dark:bg-slate-800 border-b"
          style={{ minWidth: totalWidth }}
        >
          {columns.map((column) => (
            <div
              key={column.key as string}
              className={cn(
                'px-3 py-2 font-medium text-sm text-slate-700 dark:text-slate-300',
                'flex items-center',
                column.align === 'center' && 'justify-center',
                column.align === 'right' && 'justify-end'
              )}
              style={{ width: column.width ?? 100, minWidth: column.width ?? 100 }}
            >
              {column.header}
            </div>
          ))}
        </div>
        {/* Empty message */}
        <div className="flex items-center justify-center h-32 text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex bg-slate-100 dark:bg-slate-800 border-b',
          stickyHeader && 'sticky top-0 z-10'
        )}
        style={{ minWidth: totalWidth }}
      >
        {columns.map((column) => (
          <div
            key={column.key as string}
            className={cn(
              'px-3 py-2 font-medium text-sm text-slate-700 dark:text-slate-300',
              'flex items-center',
              column.align === 'center' && 'justify-center',
              column.align === 'right' && 'justify-end'
            )}
            style={{ width: column.width ?? 100, minWidth: column.width ?? 100 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: maxHeight - rowHeight }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = data[virtualRow.index]
            const isSelected = selectedIndex === virtualRow.index
            const isHovered = hoveredIndex === virtualRow.index

            return (
              <div
                key={virtualRow.key}
                className={cn(
                  'flex absolute w-full border-b border-slate-100 dark:border-slate-800',
                  'transition-colors duration-150',
                  virtualRow.index % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-slate-50 dark:bg-slate-900/50',
                  isHovered && 'bg-blue-50 dark:bg-blue-900/20',
                  isSelected && 'bg-blue-100 dark:bg-blue-900/40',
                  onRowClick && 'cursor-pointer'
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  minWidth: totalWidth,
                }}
                onClick={() => onRowClick?.(row, virtualRow.index)}
                onMouseEnter={() => setHoveredIndex(virtualRow.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {columns.map((column) => {
                  const value = getCellValue(row, column)

                  return (
                    <div
                      key={column.key as string}
                      className={cn(
                        'px-3 py-2 text-sm text-slate-600 dark:text-slate-400',
                        'flex items-center truncate',
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end'
                      )}
                      style={{
                        width: column.width ?? 100,
                        minWidth: column.width ?? 100,
                      }}
                    >
                      {column.render
                        ? column.render(value, row, virtualRow.index)
                        : String(value ?? '-')}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Row count indicator */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-t text-xs text-slate-500 dark:text-slate-400">
        Showing {data.length} rows
        {virtualRows.length < data.length && (
          <span className="ml-2">
            (rendering {virtualRows.length} visible)
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Specialized Table Variants
// ============================================================================

/**
 * Violations table column definitions
 */
export interface ViolationRow {
  type: 'butterfly' | 'calendar'
  strike: number
  expiry: number
  expiry2?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  value: number
  description?: string
}

/**
 * Pre-configured columns for violation table
 */
export const VIOLATION_COLUMNS: Column<ViolationRow>[] = [
  {
    key: 'type',
    header: 'Type',
    width: 100,
    render: (value) => (
      <span
        className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          value === 'butterfly'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        )}
      >
        {value === 'butterfly' ? 'Butterfly' : 'Calendar'}
      </span>
    ),
  },
  {
    key: 'strike',
    header: 'Strike',
    width: 100,
    align: 'right',
    render: (value) => (typeof value === 'number' ? value.toFixed(2) : '-'),
  },
  {
    key: 'expiry',
    header: 'Expiry',
    width: 100,
    align: 'right',
    render: (value) => (typeof value === 'number' ? value.toFixed(3) : '-'),
  },
  {
    key: 'value',
    header: 'Violation',
    width: 120,
    align: 'right',
    render: (value) =>
      typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '-',
  },
  {
    key: 'severity',
    header: 'Severity',
    width: 100,
    align: 'center',
    render: (value) => {
      const severityColors: Record<string, string> = {
        low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      }
      return (
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium uppercase',
            severityColors[value as string] ?? ''
          )}
        >
          {String(value)}
        </span>
      )
    },
  },
]

/**
 * Surface points table row type
 */
export interface SurfacePointRow {
  strike: number
  maturity: number
  impliedVol: number
  localVol?: number
  delta?: number
  gamma?: number
}

/**
 * Pre-configured columns for surface points table
 */
export const SURFACE_POINT_COLUMNS: Column<SurfacePointRow>[] = [
  {
    key: 'strike',
    header: 'Strike',
    width: 100,
    align: 'right',
    render: (value) => (typeof value === 'number' ? value.toFixed(2) : '-'),
  },
  {
    key: 'maturity',
    header: 'Maturity',
    width: 100,
    align: 'right',
    render: (value) =>
      typeof value === 'number' ? `${value.toFixed(3)}Y` : '-',
  },
  {
    key: 'impliedVol',
    header: 'Impl. Vol',
    width: 100,
    align: 'right',
    render: (value) =>
      typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '-',
  },
  {
    key: 'localVol',
    header: 'Local Vol',
    width: 100,
    align: 'right',
    render: (value) =>
      typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '-',
  },
]

export default VirtualizedTable
