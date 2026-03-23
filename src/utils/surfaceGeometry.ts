/**
 * Surface Geometry Utilities for 3D Volatility Surface Visualization
 * Handles mesh generation, data transformation, and geometry operations
 */

import * as THREE from 'three';
import type { ColorScaleName } from './colorScales';
import { interpolateColorScale } from './colorScales';

export interface SurfaceDataPoint {
  strike: number;
  maturity: number;
  impliedVol: number;
}

export interface SurfaceGridData {
  strikes: number[];
  maturities: number[];
  values: number[][]; // [maturityIndex][strikeIndex] = impliedVol
}

export interface ArbitrageViolation {
  type: 'calendar' | 'butterfly' | 'vertical';
  strike1: number;
  strike2?: number;
  strike3?: number;
  maturity1: number;
  maturity2?: number;
  severity: number; // 0-1
}

/**
 * Convert flat array of surface points to a grid structure
 */
export function pointsToGrid(points: SurfaceDataPoint[]): SurfaceGridData {
  // Extract unique strikes and maturities
  const strikeSet = new Set<number>();
  const maturitySet = new Set<number>();
  
  points.forEach((p) => {
    strikeSet.add(p.strike);
    maturitySet.add(p.maturity);
  });
  
  const strikes = Array.from(strikeSet).sort((a, b) => a - b);
  const maturities = Array.from(maturitySet).sort((a, b) => a - b);
  
  // Create lookup map
  const pointMap = new Map<string, number>();
  points.forEach((p) => {
    pointMap.set(`${p.strike}-${p.maturity}`, p.impliedVol);
  });
  
  // Build grid
  const values: number[][] = [];
  for (let mi = 0; mi < maturities.length; mi++) {
    const row: number[] = [];
    for (let si = 0; si < strikes.length; si++) {
      const key = `${strikes[si]}-${maturities[mi]}`;
      const vol = pointMap.get(key);
      // Use bilinear interpolation for missing values
      row.push(vol ?? interpolateValue(strikes, maturities, pointMap, si, mi));
    }
    values.push(row);
  }
  
  return { strikes, maturities, values };
}

/**
 * Simple bilinear interpolation for missing grid points
 */
function interpolateValue(
  strikes: number[],
  maturities: number[],
  pointMap: Map<string, number>,
  si: number,
  mi: number
): number {
  // Find nearest neighbors
  const neighbors: number[] = [];
  
  for (let dsi = -1; dsi <= 1; dsi++) {
    for (let dmi = -1; dmi <= 1; dmi++) {
      if (dsi === 0 && dmi === 0) continue;
      const nsi = si + dsi;
      const nmi = mi + dmi;
      if (nsi >= 0 && nsi < strikes.length && nmi >= 0 && nmi < maturities.length) {
        const key = `${strikes[nsi]}-${maturities[nmi]}`;
        const val = pointMap.get(key);
        if (val !== undefined) neighbors.push(val);
      }
    }
  }
  
  if (neighbors.length === 0) return 0.2; // Default fallback
  return neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
}

/**
 * Normalize values to a 0-1 range for color mapping
 */
export function normalizeValues(grid: SurfaceGridData): {
  normalized: number[][];
  min: number;
  max: number;
} {
  let min = Infinity;
  let max = -Infinity;
  
  grid.values.forEach((row) => {
    row.forEach((val) => {
      min = Math.min(min, val);
      max = Math.max(max, val);
    });
  });
  
  const range = max - min || 1;
  const normalized = grid.values.map((row) =>
    row.map((val) => (val - min) / range)
  );
  
  return { normalized, min, max };
}

/**
 * Create BufferGeometry for the volatility surface
 */
export function createSurfaceGeometry(
  grid: SurfaceGridData,
  scaleX: number = 6,
  scaleY: number = 4,
  scaleZ: number = 6,
  colorScale: ColorScaleName = 'volatility'
): THREE.BufferGeometry {
  const { strikes, maturities, values } = grid;
  const numStrikes = strikes.length;
  const numMaturities = maturities.length;
  
  if (numStrikes < 2 || numMaturities < 2) {
    return new THREE.BufferGeometry();
  }
  
  // Normalize strike and maturity ranges to [-width/2, width/2]
  const strikeMin = Math.min(...strikes);
  const strikeMax = Math.max(...strikes);
  const strikeRange = strikeMax - strikeMin || 1;
  
  const maturityMin = Math.min(...maturities);
  const maturityMax = Math.max(...maturities);
  const maturityRange = maturityMax - maturityMin || 1;
  
  // Create vertices
  const vertices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  
  // Normalize values for color mapping
  const { normalized } = normalizeValues(grid);
  
  for (let mi = 0; mi < numMaturities; mi++) {
    for (let si = 0; si < numStrikes; si++) {
      // Normalize position to [-scaleX/2, scaleX/2] etc.
      const x = ((strikes[si] - strikeMin) / strikeRange - 0.5) * scaleX;
      const z = ((maturities[mi] - maturityMin) / maturityRange - 0.5) * scaleZ;
      const y = values[mi][si] * scaleY;
      
      vertices.push(x, y, z);
      
      // UV coordinates for texture mapping
      uvs.push(si / (numStrikes - 1), mi / (numMaturities - 1));
      
      // Vertex colors based on normalized IV
      const t = normalized[mi][si];
      const color = interpolateColorScale(colorScale, t);
      colors.push(color.r, color.g, color.b);
    }
  }
  
  // Create indices for triangles
  const indices: number[] = [];
  for (let mi = 0; mi < numMaturities - 1; mi++) {
    for (let si = 0; si < numStrikes - 1; si++) {
      const topLeft = mi * numStrikes + si;
      const topRight = topLeft + 1;
      const bottomLeft = (mi + 1) * numStrikes + si;
      const bottomRight = bottomLeft + 1;
      
      // Two triangles per quad
      indices.push(topLeft, bottomLeft, topRight);
      indices.push(topRight, bottomLeft, bottomRight);
    }
  }
  
  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  // Compute normals for lighting
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Create geometry with arbitrage highlighting
 */
export function createSurfaceGeometryWithArbitrage(
  grid: SurfaceGridData,
  violations: ArbitrageViolation[],
  scaleX: number = 6,
  scaleY: number = 4,
  scaleZ: number = 6,
  colorScale: ColorScaleName = 'volatility'
): THREE.BufferGeometry {
  const geometry = createSurfaceGeometry(grid, scaleX, scaleY, scaleZ, colorScale);
  
  if (violations.length === 0) {
    return geometry;
  }
  
  const { strikes, maturities } = grid;
  const numStrikes = strikes.length;
  
  // Create a set of violated points
  const violatedPoints = new Map<string, number>(); // key -> severity
  
  violations.forEach((v) => {
    const addPoint = (strike: number, maturity: number, severity: number) => {
      const key = `${strike}-${maturity}`;
      const existing = violatedPoints.get(key) || 0;
      violatedPoints.set(key, Math.max(existing, severity));
    };
    
    addPoint(v.strike1, v.maturity1, v.severity);
    if (v.strike2 && v.maturity2) {
      addPoint(v.strike2, v.maturity2, v.severity);
    }
    if (v.strike3) {
      addPoint(v.strike3, v.maturity1, v.severity);
    }
  });
  
  // Modify colors for violated points
  const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
  const colorArray = colors.array as Float32Array;
  
  for (let mi = 0; mi < maturities.length; mi++) {
    for (let si = 0; si < strikes.length; si++) {
      const key = `${strikes[si]}-${maturities[mi]}`;
      const severity = violatedPoints.get(key);
      
      if (severity !== undefined && severity > 0) {
        const idx = (mi * numStrikes + si) * 3;
        // Blend towards red based on severity
        const blendFactor = severity * 0.8;
        colorArray[idx] = colorArray[idx] * (1 - blendFactor) + 1.0 * blendFactor;
        colorArray[idx + 1] = colorArray[idx + 1] * (1 - blendFactor) + 0.2 * blendFactor;
        colorArray[idx + 2] = colorArray[idx + 2] * (1 - blendFactor) + 0.2 * blendFactor;
      }
    }
  }
  
  colors.needsUpdate = true;
  
  return geometry;
}

/**
 * Calculate surface statistics
 */
export function calculateSurfaceStats(grid: SurfaceGridData): {
  min: number;
  max: number;
  mean: number;
  std: number;
  atmVol: number;
} {
  const allValues: number[] = [];
  grid.values.forEach((row) => allValues.push(...row));
  
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const variance = allValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / allValues.length;
  const std = Math.sqrt(variance);
  
  // Find ATM vol (middle strike, middle maturity)
  const midStrikeIdx = Math.floor(grid.strikes.length / 2);
  const midMaturityIdx = Math.floor(grid.maturities.length / 2);
  const atmVol = grid.values[midMaturityIdx][midStrikeIdx];
  
  return { min, max, mean, std, atmVol };
}

/**
 * Get data ranges for axes
 */
export function getDataRanges(grid: SurfaceGridData): {
  strikeRange: [number, number];
  maturityRange: [number, number];
  volRange: [number, number];
} {
  const stats = calculateSurfaceStats(grid);
  
  return {
    strikeRange: [Math.min(...grid.strikes), Math.max(...grid.strikes)],
    maturityRange: [Math.min(...grid.maturities), Math.max(...grid.maturities)],
    volRange: [stats.min, stats.max],
  };
}

/**
 * Find closest data point to a 3D position
 */
export function findClosestPoint(
  position: THREE.Vector3,
  grid: SurfaceGridData,
  scaleX: number = 6,
  _scaleY: number = 4,
  scaleZ: number = 6
): SurfaceDataPoint | null {
  const { strikes, maturities, values } = grid;
  
  if (strikes.length === 0 || maturities.length === 0) {
    return null;
  }
  
  const strikeMin = Math.min(...strikes);
  const strikeMax = Math.max(...strikes);
  const maturityMin = Math.min(...maturities);
  const maturityMax = Math.max(...maturities);
  
  // Convert 3D position to data coordinates
  const strikeNorm = (position.x / scaleX + 0.5);
  const maturityNorm = (position.z / scaleZ + 0.5);
  
  const strike = strikeMin + strikeNorm * (strikeMax - strikeMin);
  const maturity = maturityMin + maturityNorm * (maturityMax - maturityMin);
  
  // Find nearest indices
  const si = findNearestIndex(strikes, strike);
  const mi = findNearestIndex(maturities, maturity);
  
  if (si === -1 || mi === -1) {
    return null;
  }
  
  return {
    strike: strikes[si],
    maturity: maturities[mi],
    impliedVol: values[mi][si],
  };
}

function findNearestIndex(arr: number[], value: number): number {
  if (arr.length === 0) return -1;
  
  let minDist = Infinity;
  let idx = 0;
  
  for (let i = 0; i < arr.length; i++) {
    const dist = Math.abs(arr[i] - value);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  
  return idx;
}

/**
 * Create wireframe edges geometry
 */
export function createWireframeGeometry(
  grid: SurfaceGridData,
  scaleX: number = 6,
  scaleY: number = 4,
  scaleZ: number = 6
): THREE.BufferGeometry {
  const surfaceGeometry = createSurfaceGeometry(grid, scaleX, scaleY, scaleZ);
  const wireframe = new THREE.WireframeGeometry(surfaceGeometry);
  return wireframe;
}

/**
 * Generate smooth surface with interpolation
 */
export function interpolateSurface(
  grid: SurfaceGridData,
  resolution: number = 2 // 2x resolution
): SurfaceGridData {
  const { strikes, maturities } = grid;
  
  const newStrikes: number[] = [];
  const newMaturities: number[] = [];
  
  // Generate interpolated strikes
  for (let i = 0; i < strikes.length - 1; i++) {
    for (let j = 0; j < resolution; j++) {
      newStrikes.push(strikes[i] + (strikes[i + 1] - strikes[i]) * (j / resolution));
    }
  }
  newStrikes.push(strikes[strikes.length - 1]);
  
  // Generate interpolated maturities
  for (let i = 0; i < maturities.length - 1; i++) {
    for (let j = 0; j < resolution; j++) {
      newMaturities.push(maturities[i] + (maturities[i + 1] - maturities[i]) * (j / resolution));
    }
  }
  newMaturities.push(maturities[maturities.length - 1]);
  
  // Bilinear interpolation for new values
  const newValues: number[][] = [];
  
  for (const mat of newMaturities) {
    const row: number[] = [];
    for (const str of newStrikes) {
      row.push(bilinearInterpolate(grid, str, mat));
    }
    newValues.push(row);
  }
  
  return {
    strikes: newStrikes,
    maturities: newMaturities,
    values: newValues,
  };
}

function bilinearInterpolate(grid: SurfaceGridData, strike: number, maturity: number): number {
  const { strikes, maturities, values } = grid;
  
  // Find bounding indices
  let si0 = 0, si1 = strikes.length - 1;
  for (let i = 0; i < strikes.length - 1; i++) {
    if (strikes[i] <= strike && strikes[i + 1] >= strike) {
      si0 = i;
      si1 = i + 1;
      break;
    }
  }
  
  let mi0 = 0, mi1 = maturities.length - 1;
  for (let i = 0; i < maturities.length - 1; i++) {
    if (maturities[i] <= maturity && maturities[i + 1] >= maturity) {
      mi0 = i;
      mi1 = i + 1;
      break;
    }
  }
  
  // Calculate interpolation weights
  const sWeight = strikes[si1] !== strikes[si0] 
    ? (strike - strikes[si0]) / (strikes[si1] - strikes[si0]) 
    : 0;
  const mWeight = maturities[mi1] !== maturities[mi0] 
    ? (maturity - maturities[mi0]) / (maturities[mi1] - maturities[mi0]) 
    : 0;
  
  // Bilinear interpolation
  const v00 = values[mi0][si0];
  const v10 = values[mi0][si1];
  const v01 = values[mi1][si0];
  const v11 = values[mi1][si1];
  
  const v0 = v00 + sWeight * (v10 - v00);
  const v1 = v01 + sWeight * (v11 - v01);
  
  return v0 + mWeight * (v1 - v0);
}
