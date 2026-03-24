/**
 * SurfaceAnimations - Animation utilities for 3D surfaces
 */

import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedSurfaceProps {
  children: React.ReactNode;
  animate?: boolean;
  floatAmplitude?: number;
  floatSpeed?: number;
  rotationSpeed?: number;
}

/**
 * Wrapper that adds floating animation to surfaces
 */
export function AnimatedSurface({
  children,
  animate = true,
  floatAmplitude = 0.1,
  floatSpeed = 0.5,
  rotationSpeed = 0,
}: AnimatedSurfaceProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!animate || !groupRef.current) return;
    
    // Floating effect
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmplitude;
    
    // Rotation effect
    if (rotationSpeed > 0) {
      groupRef.current.rotation.y += rotationSpeed * 0.01;
    }
  });
  
  return <group ref={groupRef}>{children}</group>;
}

interface FadeInSurfaceProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

/**
 * Fade in animation for surfaces
 */
export function FadeInSurface({
  children,
  duration = 1000,
  delay = 0,
}: FadeInSurfaceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(0);
  const startTime = useRef<number | null>(null);
  
  useFrame((state) => {
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime * 1000;
    }
    
    const elapsed = state.clock.elapsedTime * 1000 - startTime.current - delay;
    
    if (elapsed < 0) return;
    
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    
    setOpacity(eased);
    
    if (groupRef.current) {
      groupRef.current.scale.setScalar(0.8 + eased * 0.2);
    }
  });
  
  return (
    <group ref={groupRef} scale={0.8}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Clone children and pass opacity prop
          return React.cloneElement(child as React.ReactElement<{ opacity?: number }>, {
            opacity,
          });
        }
        return child;
      })}
    </group>
  );
}

interface TransitionSurfaceProps {
  fromGeometry: THREE.BufferGeometry | null;
  toGeometry: THREE.BufferGeometry | null;
  duration?: number;
  onComplete?: () => void;
  children: (geometry: THREE.BufferGeometry | null, progress: number) => React.ReactNode;
}

/**
 * Morphs between two surface geometries
 */
export function TransitionSurface({
  fromGeometry,
  toGeometry,
  duration = 1000,
  onComplete,
  children,
}: TransitionSurfaceProps) {
  const [currentGeometry, setCurrentGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [progress, setProgress] = useState(0);
  const isTransitioning = useRef(false);
  const startTime = useRef<number | null>(null);
  
  useEffect(() => {
    if (fromGeometry && toGeometry) {
      isTransitioning.current = true;
      startTime.current = null;
      setTimeout(() => setProgress(0), 0);
    }
  }, [fromGeometry, toGeometry]);
  
  useFrame((state) => {
    if (!isTransitioning.current || !fromGeometry || !toGeometry) return;
    
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime * 1000;
    }
    
    const elapsed = state.clock.elapsedTime * 1000 - startTime.current;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(rawProgress);
    
    setProgress(easedProgress);
    
    // Interpolate geometries
    const interpolated = morphGeometries(fromGeometry, toGeometry, easedProgress);
    setCurrentGeometry(interpolated);
    
    if (rawProgress >= 1) {
      isTransitioning.current = false;
      setCurrentGeometry(toGeometry);
      onComplete?.();
    }
  });
  
  return <>{children(currentGeometry || toGeometry, progress)}</>;
}

/**
 * Morph between two geometries
 */
function morphGeometries(
  from: THREE.BufferGeometry,
  to: THREE.BufferGeometry,
  t: number
): THREE.BufferGeometry {
  const geometry = from.clone();
  const fromPositions = from.getAttribute('position').array as Float32Array;
  const toPositions = to.getAttribute('position').array as Float32Array;
  const positions = new Float32Array(fromPositions.length);
  
  const minLength = Math.min(fromPositions.length, toPositions.length);
  
  for (let i = 0; i < minLength; i++) {
    positions[i] = fromPositions[i] + (toPositions[i] - fromPositions[i]) * t;
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.getAttribute('position').needsUpdate = true;
  geometry.computeVertexNormals();
  
  // Also interpolate colors if present
  const fromColors = from.getAttribute('color');
  const toColors = to.getAttribute('color');
  
  if (fromColors && toColors) {
    const fromColorArray = fromColors.array as Float32Array;
    const toColorArray = toColors.array as Float32Array;
    const colors = new Float32Array(fromColorArray.length);
    
    const colorMinLength = Math.min(fromColorArray.length, toColorArray.length);
    
    for (let i = 0; i < colorMinLength; i++) {
      colors[i] = fromColorArray[i] + (toColorArray[i] - fromColorArray[i]) * t;
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.getAttribute('color').needsUpdate = true;
  }
  
  return geometry;
}

/**
 * Smooth spring animation for position, scale, rotation
 */
interface SpringGroupProps {
  position?: [number, number, number];
  scale?: [number, number, number] | number;
  rotation?: [number, number, number];
  children: React.ReactNode;
  stiffness?: number;
  damping?: number;
}

export function SpringGroup({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  children,
  stiffness = 100,
  damping = 10,
}: SpringGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocity = useRef({ x: 0, y: 0, z: 0, sx: 0, sy: 0, sz: 0, rx: 0, ry: 0, rz: 0 });
  
  const normalizedScale = typeof scale === 'number' ? [scale, scale, scale] : scale;
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const dt = Math.min(delta, 0.1); // Cap delta to prevent instability
    
    // Spring physics for position
    const springForce = (target: number, current: number, velocity: number) => {
      const displacement = target - current;
      const springF = displacement * stiffness;
      const dampingF = velocity * damping;
      return springF - dampingF;
    };
    
    // Update position
    const pos = groupRef.current.position;
    velocity.current.x += springForce(position[0], pos.x, velocity.current.x) * dt;
    velocity.current.y += springForce(position[1], pos.y, velocity.current.y) * dt;
    velocity.current.z += springForce(position[2], pos.z, velocity.current.z) * dt;
    pos.x += velocity.current.x * dt;
    pos.y += velocity.current.y * dt;
    pos.z += velocity.current.z * dt;
    
    // Update scale
    const scl = groupRef.current.scale;
    velocity.current.sx += springForce(normalizedScale[0], scl.x, velocity.current.sx) * dt;
    velocity.current.sy += springForce(normalizedScale[1], scl.y, velocity.current.sy) * dt;
    velocity.current.sz += springForce(normalizedScale[2], scl.z, velocity.current.sz) * dt;
    scl.x += velocity.current.sx * dt;
    scl.y += velocity.current.sy * dt;
    scl.z += velocity.current.sz * dt;
    
    // Update rotation
    const rot = groupRef.current.rotation;
    velocity.current.rx += springForce(rotation[0], rot.x, velocity.current.rx) * dt;
    velocity.current.ry += springForce(rotation[1], rot.y, velocity.current.ry) * dt;
    velocity.current.rz += springForce(rotation[2], rot.z, velocity.current.rz) * dt;
    rot.x += velocity.current.rx * dt;
    rot.y += velocity.current.ry * dt;
    rot.z += velocity.current.rz * dt;
  });
  
  return (
    <group ref={groupRef} position={position} scale={normalizedScale as any} rotation={rotation}>
      {children}
    </group>
  );
}

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default AnimatedSurface;
