/**
 * useSurfaceInteraction - Hook for handling 3D surface interactions
 */

import { useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import type { SurfaceDataPoint, SurfaceGridData } from '@/utils/surfaceGeometry';
import { findClosestPoint } from '@/utils/surfaceGeometry';

export interface TooltipData {
  strike: number;
  maturity: number;
  impliedVol: number;
  position: [number, number, number];
}

interface UseSurfaceInteractionOptions {
  data: SurfaceDataPoint[];
  gridData?: SurfaceGridData | null;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  enabled?: boolean;
}

interface UseSurfaceInteractionResult {
  hoveredPoint: TooltipData | null;
  selectedPoint: TooltipData | null;
  handlePointerMove: (event: THREE.Intersection) => void;
  handlePointerOut: () => void;
  handleClick: (event: THREE.Intersection) => void;
  clearSelection: () => void;
  ranges: {
    strike: { min: number; max: number };
    maturity: { min: number; max: number };
    vol: { min: number; max: number };
  } | null;
  isHovering: boolean;
}

/**
 * Hook for handling surface interaction (hover, click, selection)
 */
export function useSurfaceInteraction({
  data,
  gridData,
  scaleX = 6,
  scaleY = 4,
  scaleZ = 6,
  enabled = true,
}: UseSurfaceInteractionOptions): UseSurfaceInteractionResult {
  const [hoveredPoint, setHoveredPoint] = useState<TooltipData | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TooltipData | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Pre-calculate ranges for position mapping
  const ranges = useMemo(() => {
    if (data.length === 0) return null;
    
    const strikes = data.map((p) => p.strike);
    const maturities = data.map((p) => p.maturity);
    const vols = data.map((p) => p.impliedVol);
    
    return {
      strike: { min: Math.min(...strikes), max: Math.max(...strikes) },
      maturity: { min: Math.min(...maturities), max: Math.max(...maturities) },
      vol: { min: Math.min(...vols), max: Math.max(...vols) },
    };
  }, [data]);
  
  // Convert 3D position to data coordinates
  const positionToData = useCallback(
    (position: THREE.Vector3): TooltipData | null => {
      if (!ranges || !gridData) return null;
      
      const point = findClosestPoint(position, gridData, scaleX, scaleY, scaleZ);
      
      if (!point) return null;
      
      // Calculate the 3D position for the tooltip
      // Note: halfX/halfZ reserved for future tooltip positioning improvements
      void scaleX; void scaleZ; // Mark as intentionally unused
      const strikeRange = ranges.strike.max - ranges.strike.min || 1;
      const maturityRange = ranges.maturity.max - ranges.maturity.min || 1;
      
      const x = ((point.strike - ranges.strike.min) / strikeRange - 0.5) * scaleX;
      const z = ((point.maturity - ranges.maturity.min) / maturityRange - 0.5) * scaleZ;
      const y = point.impliedVol * scaleY + 0.3; // Offset for tooltip visibility
      
      return {
        strike: point.strike,
        maturity: point.maturity,
        impliedVol: point.impliedVol,
        position: [x, y, z],
      };
    },
    [ranges, gridData, scaleX, scaleY, scaleZ]
  );
  
  // Handle hover
  const handlePointerMove = useCallback(
    (intersection: THREE.Intersection) => {
      if (!enabled) return;
      
      setIsHovering(true);
      const data = positionToData(intersection.point);
      setHoveredPoint(data);
    },
    [enabled, positionToData]
  );
  
  const handlePointerOut = useCallback(() => {
    setIsHovering(false);
    setHoveredPoint(null);
  }, []);
  
  // Handle click
  const handleClick = useCallback(
    (intersection: THREE.Intersection) => {
      if (!enabled) return;
      
      const data = positionToData(intersection.point);
      setSelectedPoint(data);
    },
    [enabled, positionToData]
  );
  
  const clearSelection = useCallback(() => {
    setSelectedPoint(null);
  }, []);
  
  return {
    hoveredPoint,
    selectedPoint,
    handlePointerMove,
    handlePointerOut,
    handleClick,
    clearSelection,
    ranges,
    isHovering,
  };
}

/**
 * Hook for camera interaction tracking
 */
interface UseCameraTrackingResult {
  cameraPosition: THREE.Vector3 | null;
  cameraTarget: THREE.Vector3 | null;
  updateCamera: (position: THREE.Vector3, target: THREE.Vector3) => void;
  cameraDistance: number;
}

export function useCameraTracking(): UseCameraTrackingResult {
  const [cameraPosition, setCameraPosition] = useState<THREE.Vector3 | null>(null);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  
  const updateCamera = useCallback((position: THREE.Vector3, target: THREE.Vector3) => {
    setCameraPosition(position.clone());
    setCameraTarget(target.clone());
  }, []);
  
  const cameraDistance = useMemo(() => {
    if (!cameraPosition || !cameraTarget) return 0;
    return cameraPosition.distanceTo(cameraTarget);
  }, [cameraPosition, cameraTarget]);
  
  return {
    cameraPosition,
    cameraTarget,
    updateCamera,
    cameraDistance,
  };
}

/**
 * Hook for multi-select functionality
 */
interface UseMultiSelectOptions {
  data: SurfaceDataPoint[];
  maxSelections?: number;
}

interface UseMultiSelectResult {
  selectedPoints: TooltipData[];
  toggleSelection: (point: TooltipData) => void;
  clearSelections: () => void;
  isSelected: (strike: number, maturity: number) => boolean;
}

export function useMultiSelect({
  data: _data,
  maxSelections = 5,
}: UseMultiSelectOptions): UseMultiSelectResult {
  const [selectedPoints, setSelectedPoints] = useState<TooltipData[]>([]);
  
  const toggleSelection = useCallback(
    (point: TooltipData) => {
      setSelectedPoints((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.strike === point.strike && p.maturity === point.maturity
        );
        
        if (existingIndex >= 0) {
          // Remove if already selected
          return prev.filter((_, i) => i !== existingIndex);
        } else if (prev.length < maxSelections) {
          // Add if under limit
          return [...prev, point];
        }
        
        return prev;
      });
    },
    [maxSelections]
  );
  
  const clearSelections = useCallback(() => {
    setSelectedPoints([]);
  }, []);
  
  const isSelected = useCallback(
    (strike: number, maturity: number) => {
      return selectedPoints.some(
        (p) => p.strike === strike && p.maturity === maturity
      );
    },
    [selectedPoints]
  );
  
  return {
    selectedPoints,
    toggleSelection,
    clearSelections,
    isSelected,
  };
}

export default useSurfaceInteraction;
