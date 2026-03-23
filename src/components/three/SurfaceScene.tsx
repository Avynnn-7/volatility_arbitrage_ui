/**
 * SurfaceScene - Main Canvas wrapper with lighting and environment
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface SurfaceSceneProps {
  children: React.ReactNode;
  backgroundColor?: string;
  ambientIntensity?: number;
  showGrid?: boolean;
  className?: string;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
  );
}

export function SurfaceScene({
  children,
  backgroundColor = '#0a0a0f',
  ambientIntensity = 0.6,
  showGrid = true,
  className,
  cameraPosition = [8, 6, 8],
  cameraFov = 50,
}: SurfaceSceneProps) {
  return (
    <div className={`w-full h-full min-h-[500px] ${className || ''}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: 'high-performance',
        }}
        style={{ background: backgroundColor }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={cameraPosition}
            fov={cameraFov}
            near={0.1}
            far={1000}
          />

          {/* Lighting */}
          <ambientLight intensity={ambientIntensity} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-10, 5, -5]} intensity={0.5} />
          <pointLight position={[0, 10, 0]} intensity={0.3} />

          {/* Environment for reflections (subtle) */}
          <Environment preset="city" />

          {/* Grid helper */}
          {showGrid && (
            <gridHelper
              args={[20, 20, '#333340', '#222230']}
              position={[0, -0.01, 0]}
            />
          )}

          {/* Children (surfaces, controls, etc.) */}
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default SurfaceScene;
