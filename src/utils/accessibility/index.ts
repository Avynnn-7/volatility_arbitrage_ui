/**
 * Accessibility Utilities
 * Barrel export for all accessibility utilities
 */

export {
  // Focus management
  useFocusTrap,
  useFocusReturn,
  useFocusOnMount,
  getFocusableElements,
  
  // Keyboard navigation
  useArrowNavigation,
  useEscapeKey,
  
  // Screen reader utilities
  useAnnounce,
  useId,
  useAriaDescribedBy,
  
  // Reduced motion
  useReducedMotion,
  
  // Color contrast
  checkContrast,
  
  // ARIA helpers
  getExpandableProps,
  getSelectableProps,
  getLoadingProps,
} from './a11yUtils'
