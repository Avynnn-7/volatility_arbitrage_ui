/**
 * Three.js components barrel export
 */

// Scene and Canvas
export { SurfaceScene } from './SurfaceScene';
export { SurfaceGrid } from './SurfaceGrid';

// Surface mesh components
export { VolatilitySurface, VolatilitySurfaceWireframe } from './VolatilitySurface';
export { SurfaceComparison, calculateComparisonStats } from './SurfaceComparison';
export type { ComparisonMode } from './SurfaceComparison';

// Local Volatility Surface
export { LocalVolSurface3D } from './LocalVolSurface';

// Controls
export { SurfaceControls, cameraPresets } from './SurfaceControls';
export type { CameraPreset, SurfaceControlsRef } from './SurfaceControls';

// Axes and labels
export { SurfaceAxes } from './SurfaceAxes';

// Tooltips and interaction
export { SurfaceTooltip, DataPointMarker } from './SurfaceTooltip';
export type { TooltipData } from './SurfaceTooltip';

// Color legend
export { SurfaceColorLegend, CompactColorLegend } from './SurfaceColorLegend';

// Arbitrage highlighting
export { ArbitrageHighlights, ArbitrageSummary } from './ArbitrageHighlights';
export type { ArbitrageViolation } from './ArbitrageHighlights';

// Animations
export { 
  AnimatedSurface, 
  FadeInSurface, 
  TransitionSurface, 
  SpringGroup 
} from './SurfaceAnimations';

// Export utilities
export { 
  useSurfaceExport, 
  SurfaceExportManager, 
  ExportReferenceCapture,
  downloadCanvasImage 
} from './SurfaceExport';

// Export controls UI
export { ExportControls, InlineExportButtons } from './ExportControls';
