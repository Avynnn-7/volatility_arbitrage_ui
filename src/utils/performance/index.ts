/**
 * Performance Utilities
 * Barrel export for performance optimization utilities
 */

// Memoization helpers
export {
  deepMemo,
  shallowEqual,
  deepEqual,
  useDeepMemo,
  useStableCallback,
  useDebouncedValue,
  useDebouncedCallback,
  useThrottledCallback,
  arrayPropsEqual,
  createMemoizedSelector,
  measureTime,
  profileFunction,
  useAnimationFrame,
  batchUpdates,
} from './memoHelpers'

// Virtualized table
export {
  VirtualizedTable,
  VIOLATION_COLUMNS,
  SURFACE_POINT_COLUMNS,
} from './virtualizedTable'

export type {
  Column,
  VirtualizedTableProps,
  ViolationRow,
  SurfacePointRow,
} from './virtualizedTable'
