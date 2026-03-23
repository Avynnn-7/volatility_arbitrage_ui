/**
 * useSurfaceData - Hook for processing and optimizing surface data for 3D visualization
 */

import { useMemo } from 'react';
import type { SurfaceDataPoint, SurfaceGridData } from '@/utils/surfaceGeometry';
import { 
  pointsToGrid, 
  calculateSurfaceStats 
} from '@/utils/surfaceGeometry';

interface UseSurfaceDataOptions {
  data: SurfaceDataPoint[];
  maxPoints?: number;
  downsampleThreshold?: number;
}

interface UseSurfaceDataResult {
  gridData: SurfaceGridData | null;
  originalCount: number;
  displayCount: number;
  isDownsampled: boolean;
  strikeRange: [number, number];
  maturityRange: [number, number];
  volRange: [number, number];
  stats: {
    min: number;
    max: number;
    mean: number;
    std: number;
    atmVol: number;
  } | null;
}

/**
 * Hook for processing and optimizing surface data
 */
export function useSurfaceData({
  data,
  maxPoints = 10000,
  downsampleThreshold = 5000,
}: UseSurfaceDataOptions): UseSurfaceDataResult {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        gridData: null,
        originalCount: 0,
        displayCount: 0,
        isDownsampled: false,
        strikeRange: [0, 0] as [number, number],
        maturityRange: [0, 0] as [number, number],
        volRange: [0, 0] as [number, number],
        stats: null,
      };
    }
    
    // Calculate ranges
    const strikes = data.map((p) => p.strike);
    const maturities = data.map((p) => p.maturity);
    const vols = data.map((p) => p.impliedVol);
    
    const strikeRange: [number, number] = [Math.min(...strikes), Math.max(...strikes)];
    const maturityRange: [number, number] = [Math.min(...maturities), Math.max(...maturities)];
    const volRange: [number, number] = [Math.min(...vols), Math.max(...vols)];
    
    // Downsample if necessary
    let processedData = data;
    const isDownsampled = data.length > downsampleThreshold;
    
    if (isDownsampled) {
      processedData = downsampleData(data, maxPoints);
    }
    
    // Convert to grid
    const gridData = pointsToGrid(processedData);
    
    // Calculate stats
    const stats = calculateSurfaceStats(gridData);
    
    return {
      gridData,
      originalCount: data.length,
      displayCount: processedData.length,
      isDownsampled,
      strikeRange,
      maturityRange,
      volRange,
      stats,
    };
  }, [data, maxPoints, downsampleThreshold]);
}

/**
 * Downsample data while preserving key features
 */
function downsampleData(
  data: SurfaceDataPoint[],
  maxPoints: number
): SurfaceDataPoint[] {
  if (data.length <= maxPoints) return data;
  
  // Get unique strikes and maturities
  const strikes = [...new Set(data.map((p) => p.strike))].sort((a, b) => a - b);
  const maturities = [...new Set(data.map((p) => p.maturity))].sort((a, b) => a - b);
  
  // Calculate target grid size
  const gridSize = Math.sqrt(maxPoints);
  const strikeStep = Math.max(1, Math.floor(strikes.length / gridSize));
  const maturityStep = Math.max(1, Math.floor(maturities.length / gridSize));
  
  // Select subset of strikes and maturities
  const selectedStrikes = new Set(
    strikes.filter((_, i) => i % strikeStep === 0)
  );
  const selectedMaturities = new Set(
    maturities.filter((_, i) => i % maturityStep === 0)
  );
  
  // Always include first and last
  selectedStrikes.add(strikes[0]);
  selectedStrikes.add(strikes[strikes.length - 1]);
  selectedMaturities.add(maturities[0]);
  selectedMaturities.add(maturities[maturities.length - 1]);
  
  // Filter data
  return data.filter(
    (p) => selectedStrikes.has(p.strike) && selectedMaturities.has(p.maturity)
  );
}

/**
 * Hook for comparing two surfaces
 */
interface UseSurfaceComparisonOptions {
  originalData: SurfaceDataPoint[];
  correctedData: SurfaceDataPoint[];
}

interface SurfaceComparisonResult {
  originalGrid: SurfaceGridData | null;
  correctedGrid: SurfaceGridData | null;
  diffGrid: SurfaceGridData | null;
  maxCorrection: number;
  avgCorrection: number;
  rmse: number;
  numCorrected: number;
}

export function useSurfaceComparison({
  originalData,
  correctedData,
}: UseSurfaceComparisonOptions): SurfaceComparisonResult {
  return useMemo(() => {
    if (!originalData.length || !correctedData.length) {
      return {
        originalGrid: null,
        correctedGrid: null,
        diffGrid: null,
        maxCorrection: 0,
        avgCorrection: 0,
        rmse: 0,
        numCorrected: 0,
      };
    }
    
    const originalGrid = pointsToGrid(originalData);
    const correctedGrid = pointsToGrid(correctedData);
    
    // Create correction map
    const correctedMap = new Map<string, number>();
    correctedData.forEach((p) => {
      correctedMap.set(`${p.strike}-${p.maturity}`, p.impliedVol);
    });
    
    // Calculate diff and stats
    let maxCorrection = 0;
    let sumCorrection = 0;
    let sumSquaredError = 0;
    let numCorrected = 0;
    
    const diffData: SurfaceDataPoint[] = originalData.map((p) => {
      const correctedVol = correctedMap.get(`${p.strike}-${p.maturity}`) ?? p.impliedVol;
      const diff = correctedVol - p.impliedVol;
      
      maxCorrection = Math.max(maxCorrection, Math.abs(diff));
      sumCorrection += Math.abs(diff);
      sumSquaredError += diff * diff;
      if (Math.abs(diff) > 0.0001) numCorrected++;
      
      return {
        strike: p.strike,
        maturity: p.maturity,
        impliedVol: diff,
      };
    });
    
    const diffGrid = pointsToGrid(diffData);
    const n = originalData.length;
    
    return {
      originalGrid,
      correctedGrid,
      diffGrid,
      maxCorrection,
      avgCorrection: sumCorrection / n,
      rmse: Math.sqrt(sumSquaredError / n),
      numCorrected,
    };
  }, [originalData, correctedData]);
}

export default useSurfaceData;
