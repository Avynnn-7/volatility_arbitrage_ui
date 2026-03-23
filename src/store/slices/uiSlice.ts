import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  UIState,
  Theme,
  SidebarState,
  Toast,
  GlobalLoadingState,
} from '@/types'
import { DEFAULT_UI_STATE } from '@/types'

/**
 * Generate unique ID for toasts
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Initial UI state
 */
const initialState: UIState = DEFAULT_UI_STATE

/**
 * UI state slice
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // ========================================================================
    // Theme Actions
    // ========================================================================
    
    /**
     * Set theme
     */
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
    },

    /**
     * Toggle theme between dark and light
     */
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },

    // ========================================================================
    // Layout Actions
    // ========================================================================
    
    /**
     * Set sidebar state
     */
    setSidebarState: (state, action: PayloadAction<SidebarState>) => {
      state.layout.sidebar = action.payload
    },

    /**
     * Toggle sidebar
     */
    toggleSidebar: (state) => {
      state.layout.sidebar = state.layout.sidebar === 'expanded' ? 'collapsed' : 'expanded'
    },

    /**
     * Toggle footer visibility
     */
    toggleFooter: (state) => {
      state.layout.showFooter = !state.layout.showFooter
    },

    // ========================================================================
    // Modal Actions
    // ========================================================================
    
    /**
     * Open modal
     */
    openModal: (state, action: PayloadAction<{ modalId: string; data?: unknown }>) => {
      state.modal = {
        isOpen: true,
        modalId: action.payload.modalId,
        data: action.payload.data,
      }
    },

    /**
     * Close modal
     */
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        modalId: null,
        data: undefined,
      }
    },

    // ========================================================================
    // Toast Actions
    // ========================================================================
    
    /**
     * Add toast notification
     */
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: generateId(),
        ...action.payload,
      }
      state.toasts.push(toast)
    },

    /**
     * Remove toast by ID
     */
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },

    /**
     * Clear all toasts
     */
    clearToasts: (state) => {
      state.toasts = []
    },

    // ========================================================================
    // Loading Actions
    // ========================================================================
    
    /**
     * Set global loading state
     */
    setGlobalLoading: (state, action: PayloadAction<GlobalLoadingState>) => {
      state.globalLoading = action.payload
    },

    /**
     * Start global loading
     */
    startLoading: (state, action: PayloadAction<string | undefined>) => {
      state.globalLoading = {
        isLoading: true,
        message: action.payload,
      }
    },

    /**
     * Stop global loading
     */
    stopLoading: (state) => {
      state.globalLoading = {
        isLoading: false,
      }
    },

    /**
     * Update loading progress
     */
    setLoadingProgress: (state, action: PayloadAction<number>) => {
      state.globalLoading.progress = action.payload
    },

    // ========================================================================
    // Status Actions
    // ========================================================================
    
    /**
     * Set mobile status
     */
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload
    },

    /**
     * Set online status
     */
    setIsOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },
  },
})

export const {
  setTheme,
  toggleTheme,
  setSidebarState,
  toggleSidebar,
  toggleFooter,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearToasts,
  setGlobalLoading,
  startLoading,
  stopLoading,
  setLoadingProgress,
  setIsMobile,
  setIsOnline,
} = uiSlice.actions

export const uiReducer = uiSlice.reducer

// ============================================================================
// Toast Helper Actions (Thunks)
// ============================================================================

/**
 * Show success toast
 */
export const showSuccessToast = (title: string, message?: string) => 
  addToast({ type: 'success', title, message, duration: 5000 })

/**
 * Show error toast
 */
export const showErrorToast = (title: string, message?: string) => 
  addToast({ type: 'error', title, message, duration: 8000 })

/**
 * Show warning toast
 */
export const showWarningToast = (title: string, message?: string) => 
  addToast({ type: 'warning', title, message, duration: 6000 })

/**
 * Show info toast
 */
export const showInfoToast = (title: string, message?: string) => 
  addToast({ type: 'info', title, message, duration: 5000 })
