/**
 * Color Scales for Volatility Surface Visualization
 * Provides multiple color schemes optimized for financial data
 */

import * as THREE from 'three';

export type ColorScaleName = 
  | 'plasma' 
  | 'viridis' 
  | 'inferno' 
  | 'magma' 
  | 'coolwarm' 
  | 'volatility'
  | 'thermal';

interface ColorStop {
  position: number; // 0-1
  color: THREE.Color;
}

/**
 * Predefined color scales optimized for financial data visualization
 */
export const colorScales: Record<ColorScaleName, ColorStop[]> = {
  plasma: [
    { position: 0.0, color: new THREE.Color('#0d0887') },
    { position: 0.25, color: new THREE.Color('#7e03a8') },
    { position: 0.5, color: new THREE.Color('#cc4778') },
    { position: 0.75, color: new THREE.Color('#f89540') },
    { position: 1.0, color: new THREE.Color('#f0f921') },
  ],
  viridis: [
    { position: 0.0, color: new THREE.Color('#440154') },
    { position: 0.25, color: new THREE.Color('#3b528b') },
    { position: 0.5, color: new THREE.Color('#21918c') },
    { position: 0.75, color: new THREE.Color('#5ec962') },
    { position: 1.0, color: new THREE.Color('#fde725') },
  ],
  inferno: [
    { position: 0.0, color: new THREE.Color('#000004') },
    { position: 0.25, color: new THREE.Color('#57106e') },
    { position: 0.5, color: new THREE.Color('#bc3754') },
    { position: 0.75, color: new THREE.Color('#f98e09') },
    { position: 1.0, color: new THREE.Color('#fcffa4') },
  ],
  magma: [
    { position: 0.0, color: new THREE.Color('#000004') },
    { position: 0.25, color: new THREE.Color('#51127c') },
    { position: 0.5, color: new THREE.Color('#b63679') },
    { position: 0.75, color: new THREE.Color('#fb8861') },
    { position: 1.0, color: new THREE.Color('#fcfdbf') },
  ],
  coolwarm: [
    { position: 0.0, color: new THREE.Color('#3b4cc0') },
    { position: 0.25, color: new THREE.Color('#7699f6') },
    { position: 0.5, color: new THREE.Color('#f7f7f7') },
    { position: 0.75, color: new THREE.Color('#f6a385') },
    { position: 1.0, color: new THREE.Color('#b40426') },
  ],
  // Custom scale optimized for volatility surfaces
  volatility: [
    { position: 0.0, color: new THREE.Color('#1a1a2e') },   // Deep purple (low vol)
    { position: 0.2, color: new THREE.Color('#4a4e8c') },   // Purple-blue
    { position: 0.4, color: new THREE.Color('#2d6a9f') },   // Blue
    { position: 0.6, color: new THREE.Color('#4ecdc4') },   // Cyan
    { position: 0.8, color: new THREE.Color('#ffe66d') },   // Yellow
    { position: 1.0, color: new THREE.Color('#ff6b6b') },   // Red (high vol)
  ],
  thermal: [
    { position: 0.0, color: new THREE.Color('#000033') },
    { position: 0.25, color: new THREE.Color('#0066cc') },
    { position: 0.5, color: new THREE.Color('#00cc66') },
    { position: 0.75, color: new THREE.Color('#ffcc00') },
    { position: 1.0, color: new THREE.Color('#ff3300') },
  ],
};

/**
 * Interpolate color from a color scale at a given position (0-1)
 */
export function interpolateColorScale(
  scale: ColorScaleName,
  t: number
): THREE.Color {
  const stops = colorScales[scale];
  t = Math.max(0, Math.min(1, t));
  
  // Find the two stops we're between
  let lowerStop = stops[0];
  let upperStop = stops[stops.length - 1];
  
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].position && t <= stops[i + 1].position) {
      lowerStop = stops[i];
      upperStop = stops[i + 1];
      break;
    }
  }
  
  // Calculate local t between the two stops
  const range = upperStop.position - lowerStop.position;
  const localT = range > 0 ? (t - lowerStop.position) / range : 0;
  
  // Interpolate
  const result = new THREE.Color();
  result.lerpColors(lowerStop.color, upperStop.color, localT);
  
  return result;
}

/**
 * Get color for a normalized volatility value (0-1)
 * Uses a "plasma" style colormap - good for financial data
 */
export function getVolatilityColor(t: number): THREE.Color {
  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));
  
  // Plasma-inspired colormap (purple -> blue -> cyan -> yellow)
  const color = new THREE.Color();
  
  if (t < 0.25) {
    // Purple to blue
    const lt = t / 0.25;
    color.setRGB(
      0.5 - lt * 0.2,  // R: 0.5 -> 0.3
      lt * 0.4,         // G: 0 -> 0.4
      0.5 + lt * 0.5    // B: 0.5 -> 1.0
    );
  } else if (t < 0.5) {
    // Blue to cyan
    const lt = (t - 0.25) / 0.25;
    color.setRGB(
      0.3 - lt * 0.3,   // R: 0.3 -> 0
      0.4 + lt * 0.6,   // G: 0.4 -> 1.0
      1.0               // B: 1.0
    );
  } else if (t < 0.75) {
    // Cyan to yellow
    const lt = (t - 0.5) / 0.25;
    color.setRGB(
      lt,               // R: 0 -> 1
      1.0,              // G: 1.0
      1.0 - lt          // B: 1.0 -> 0
    );
  } else {
    // Yellow to red/orange (for high vol areas)
    const lt = (t - 0.75) / 0.25;
    color.setRGB(
      1.0,              // R: 1.0
      1.0 - lt * 0.5,   // G: 1.0 -> 0.5
      0                 // B: 0
    );
  }
  
  return color;
}

/**
 * Generate a gradient texture for the surface
 */
export function createGradientTexture(
  scale: ColorScaleName,
  width: number = 256
): THREE.DataTexture {
  const data = new Uint8Array(width * 4);
  
  for (let i = 0; i < width; i++) {
    const t = i / (width - 1);
    const color = interpolateColorScale(scale, t);
    
    data[i * 4 + 0] = Math.floor(color.r * 255);
    data[i * 4 + 1] = Math.floor(color.g * 255);
    data[i * 4 + 2] = Math.floor(color.b * 255);
    data[i * 4 + 3] = 255;
  }
  
  const texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  
  return texture;
}

/**
 * Apply color scale to surface geometry vertex colors
 */
export function applyColorScaleToGeometry(
  geometry: THREE.BufferGeometry,
  values: number[],
  scale: ColorScaleName
): void {
  const colors = new Float32Array(values.length * 3);
  
  // Find min/max for normalization
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  for (let i = 0; i < values.length; i++) {
    const t = (values[i] - min) / range;
    const color = interpolateColorScale(scale, t);
    
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

/**
 * Generate CSS gradient string for legend display
 */
export function getGradientCSSString(scale: ColorScaleName): string {
  const stops = colorScales[scale];
  const gradientStops = stops
    .map((stop) => `${stop.color.getStyle()} ${stop.position * 100}%`)
    .join(', ');
  return `linear-gradient(to right, ${gradientStops})`;
}

/**
 * Get arbitrage highlighting color based on severity
 */
export function getArbitrageColor(severity: number): THREE.Color {
  // severity: 0 = none, 1 = severe
  if (severity <= 0) {
    return new THREE.Color('#00ff00'); // Green - no violation
  } else if (severity < 0.33) {
    return new THREE.Color('#ffff00'); // Yellow - minor
  } else if (severity < 0.66) {
    return new THREE.Color('#ff8800'); // Orange - moderate
  } else {
    return new THREE.Color('#ff0000'); // Red - severe
  }
}
