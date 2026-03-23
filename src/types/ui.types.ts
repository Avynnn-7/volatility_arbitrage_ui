/**
 * UI-related type definitions
 */

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Application theme
 */
export type Theme = 'dark' | 'light' | 'system'

/**
 * Color scheme
 */
export interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  error: string
  warning: string
  success: string
  info: string
}

// ============================================================================
// Layout Types
// ============================================================================

/**
 * Sidebar state
 */
export type SidebarState = 'expanded' | 'collapsed' | 'hidden'

/**
 * Panel configuration
 */
export interface PanelConfig {
  id: string
  title: string
  isVisible: boolean
  isMinimized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  sidebar: SidebarState
  panels: PanelConfig[]
  showFooter: boolean
}

// ============================================================================
// Modal Types
// ============================================================================

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean
  modalId: string | null
  data?: unknown
}

/**
 * Confirmation modal data
 */
export interface ConfirmationModalData {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel?: () => void
}

// ============================================================================
// Toast/Notification Types
// ============================================================================

/**
 * Toast type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast notification
 */
export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

// ============================================================================
// Loading Types
// ============================================================================

/**
 * Global loading state
 */
export interface GlobalLoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

// ============================================================================
// UI State
// ============================================================================

/**
 * Complete UI state
 */
export interface UIState {
  // Theme
  theme: Theme
  
  // Layout
  layout: LayoutConfig
  
  // Modals
  modal: ModalState
  
  // Toasts
  toasts: Toast[]
  
  // Loading
  globalLoading: GlobalLoadingState
  
  // Misc
  isMobile: boolean
  isOnline: boolean
}

/**
 * Default UI state
 */
export const DEFAULT_UI_STATE: UIState = {
  theme: 'dark',
  layout: {
    sidebar: 'expanded',
    panels: [],
    showFooter: true,
  },
  modal: {
    isOpen: false,
    modalId: null,
  },
  toasts: [],
  globalLoading: {
    isLoading: false,
  },
  isMobile: false,
  isOnline: true,
}
