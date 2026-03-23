/**
 * SurfaceComparison - Side-by-side or overlay comparison of surfaces
 */

import { VolatilitySurface, VolatilitySurfaceWireframe } from './VolatilitySurface';
import type { SurfaceDataPoint } from '@/utils/surfaceGeometry';
import type { ColorScaleName } from '@/utils/colorScales';

export type ComparisonMode = 'overlay' | 'sideBySide' | 'diff';

interface SurfaceComparisonProps {
  originalData: SurfaceDataPoint[];
  correctedData: SurfaceDataPoint[];
  mode?: ComparisonMode;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  showOriginal?: boolean;
  showCorrected?: boolean;
  originalOpacity?: number;
  correctedOpacity?: number;
  colorScale?: ColorScaleName;
}

export function SurfaceComparison({
  originalData,
  correctedData,
  mode = 'overlay',
  scaleX = 6,
  scaleY = 4,
  scaleZ = 6,
  showOriginal = true,
  showCorrected = true,
  originalOpacity = 0.5,
  correctedOpacity = 1,
  colorScale = 'volatility',
}: SurfaceComparisonProps) {
  if (mode === 'sideBySide') {
    const offset = scaleX * 0.6;
    return (
      <group>
        {/* Original surface - left */}
        {showOriginal && originalData.length > 0 && (
          <group position={[-offset, 0, 0]}>
            <VolatilitySurface
              data={originalData}
              scaleX={scaleX * 0.8}
              scaleY={scaleY}
              scaleZ={scaleZ * 0.8}
              opacity={1}
              colorScale={colorScale}
            />
          </group>
        )}
        
        {/* Corrected surface - right */}
        {showCorrected && correctedData.length > 0 && (
          <group position={[offset, 0, 0]}>
            <VolatilitySurface
              data={correctedData}
              scaleX={scaleX * 0.8}
              scaleY={scaleY}
              scaleZ={scaleZ * 0.8}
              opacity={1}
              colorScale={colorScale}
            />
          </group>
        )}
      </group>
    );
  }
  
  if (mode === 'diff') {
    // Create difference surface
    const diffData = createDiffSurface(originalData, correctedData);
    return (
      <VolatilitySurface
        data={diffData}
        scaleX={scaleX}
        scaleY={scaleY * 0.5} // Smaller scale for diff
        scaleZ={scaleZ}
        opacity={1}
        colorScale="coolwarm"
      />
    );
  }
  
  // Default: overlay mode
  return (
    <group>
      {/* Original surface - semi-transparent */}
      {showOriginal && originalData.length > 0 && (
        <>
          <VolatilitySurface
            data={originalData}
            scaleX={scaleX}
            scaleY={scaleY}
            scaleZ={scaleZ}
            opacity={originalOpacity}
            useVertexColors={false}
            color="#ef4444" // Red for original
          />
          {/* Original wireframe */}
          <VolatilitySurfaceWireframe
            data={originalData}
            scaleX={scaleX}
            scaleY={scaleY}
            scaleZ={scaleZ}
            color="#ff6b6b"
            opacity={0.4}
          />
        </>
      )}
      
      {/* Corrected surface - solid */}
      {showCorrected && correctedData.length > 0 && (
        <VolatilitySurface
          data={correctedData}
          scaleX={scaleX}
          scaleY={scaleY}
          scaleZ={scaleZ}
          opacity={correctedOpacity}
          useVertexColors={true}
          colorScale={colorScale}
        />
      )}
    </group>
  );
}

/**
 * Create a difference surface showing corrections
 */
function createDiffSurface(
  original: SurfaceDataPoint[],
  corrected: SurfaceDataPoint[]
): SurfaceDataPoint[] {
  const correctedMap = new Map<string, number>();
  corrected.forEach((p) => {
    correctedMap.set(`${p.strike}-${p.maturity}`, p.impliedVol);
  });
  
  return original.map((p) => {
    const correctedVol = correctedMap.get(`${p.strike}-${p.maturity}`) ?? p.impliedVol;
    return {
      strike: p.strike,
      maturity: p.maturity,
      impliedVol: correctedVol - p.impliedVol, // Can be negative
    };
  });
}

/**
 * Calculate comparison statistics
 */
export function calculateComparisonStats(
  original: SurfaceDataPoint[],
  corrected: SurfaceDataPoint[]
): {
  maxCorrection: number;
  minCorrection: number;
  avgCorrection: number;
  rmse: number;
  numCorrected: number;
} {
  const correctedMap = new Map<string, number>();
  corrected.forEach((p) => {
    correctedMap.set(`${p.strike}-${p.maturity}`, p.impliedVol);
  });
  
  let maxCorrection = 0;
  let minCorrection = 0;
  let sumCorrection = 0;
  let sumSquaredError = 0;
  let numCorrected = 0;
  
  original.forEach((p) => {
    const correctedVol = correctedMap.get(`${p.strike}-${p.maturity}`);
    if (correctedVol !== undefined) {
      const diff = correctedVol - p.impliedVol;
      maxCorrection = Math.max(maxCorrection, diff);
      minCorrection = Math.min(minCorrection, diff);
      sumCorrection += Math.abs(diff);
      sumSquaredError += diff * diff;
      if (Math.abs(diff) > 0.0001) numCorrected++;
    }
  });
  
  const n = original.length;
  return {
    maxCorrection,
    minCorrection,
    avgCorrection: sumCorrection / n,
    rmse: Math.sqrt(sumSquaredError / n),
    numCorrected,
  };
}

export default SurfaceComparison;
