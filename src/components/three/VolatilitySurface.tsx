/**
 * VolatilitySurface - Main 3D surface mesh component
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SurfaceDataPoint, ArbitrageViolation } from '@/utils/surfaceGeometry';
import { 
  createSurfaceGeometry, 
  createSurfaceGeometryWithArbitrage,
  pointsToGrid, 
} from '@/utils/surfaceGeometry';
import type { ColorScaleName } from '@/utils/colorScales';

interface VolatilitySurfaceProps {
  data: SurfaceDataPoint[];
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  wireframe?: boolean;
  opacity?: number;
  color?: string;
  useVertexColors?: boolean;
  animated?: boolean;
  position?: [number, number, number];
  colorScale?: ColorScaleName;
  violations?: ArbitrageViolation[];
  onPointerMove?: (event: THREE.Event & { point?: THREE.Vector3 }) => void;
  onPointerOut?: () => void;
  onClick?: (event: THREE.Event & { point?: THREE.Vector3 }) => void;
}

export function VolatilitySurface({
  data,
  scaleX = 6,
  scaleY = 4,
  scaleZ = 6,
  wireframe = false,
  opacity = 1,
  color = '#3B82F6',
  useVertexColors = true,
  animated = false,
  position = [0, 0, 0],
  colorScale = 'volatility',
  violations = [],
  onPointerMove,
  onPointerOut,
  onClick,
}: VolatilitySurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Convert data to grid and create geometry
  const geometry = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const grid = pointsToGrid(data);
    
    if (violations.length > 0) {
      return createSurfaceGeometryWithArbitrage(grid, violations, scaleX, scaleY, scaleZ, colorScale);
    }
    
    return createSurfaceGeometry(grid, scaleX, scaleY, scaleZ, colorScale);
  }, [data, scaleX, scaleY, scaleZ, colorScale, violations]);
  
  // Animation: subtle floating effect
  useFrame((state) => {
    if (animated && meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  if (!geometry) {
    return null;
  }
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      castShadow
      receiveShadow
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <meshStandardMaterial
        color={useVertexColors ? '#ffffff' : color}
        vertexColors={useVertexColors}
        wireframe={wireframe}
        transparent={opacity < 1}
        opacity={opacity}
        metalness={0.1}
        roughness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Wireframe version for overlay
interface VolatilitySurfaceWireframeProps {
  data: SurfaceDataPoint[];
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  color?: string;
  opacity?: number;
  position?: [number, number, number];
}

export function VolatilitySurfaceWireframe({
  data,
  scaleX = 6,
  scaleY = 4,
  scaleZ = 6,
  color = '#ffffff',
  opacity = 0.3,
  position = [0, 0, 0],
}: VolatilitySurfaceWireframeProps) {
  const geometry = useMemo(() => {
    if (!data || data.length === 0) return null;
    const grid = pointsToGrid(data);
    return createSurfaceGeometry(grid, scaleX, scaleY, scaleZ);
  }, [data, scaleX, scaleY, scaleZ]);
  
  if (!geometry) return null;
  
  return (
    <mesh geometry={geometry} position={position}>
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

export default VolatilitySurface;
