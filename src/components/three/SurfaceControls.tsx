/**
 * SurfaceControls - OrbitControls wrapper with camera presets
 */

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Camera preset positions
export const cameraPresets = {
  front: { position: [0, 4, 12] as [number, number, number], target: [0, 1, 0] as [number, number, number] },
  top: { position: [0, 15, 0.1] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  side: { position: [12, 4, 0] as [number, number, number], target: [0, 1, 0] as [number, number, number] },
  isometric: { position: [8, 6, 8] as [number, number, number], target: [0, 1, 0] as [number, number, number] },
  corner: { position: [-8, 6, 8] as [number, number, number], target: [0, 1, 0] as [number, number, number] },
};

export type CameraPreset = keyof typeof cameraPresets;

interface SurfaceControlsProps {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  target?: [number, number, number];
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
  preset?: CameraPreset;
}

export interface SurfaceControlsRef {
  reset: () => void;
  setPreset: (preset: CameraPreset) => void;
  getCamera: () => THREE.Camera;
}

export const SurfaceControls = forwardRef<SurfaceControlsRef, SurfaceControlsProps>(
  function SurfaceControls(
    {
      autoRotate = false,
      autoRotateSpeed = 1,
      enableZoom = true,
      enablePan = true,
      enableRotate = true,
      minDistance = 3,
      maxDistance = 30,
      target = [0, 1, 0],
      onCameraChange,
      preset,
    },
    ref
  ) {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();
    
    // Handle camera change events
    useEffect(() => {
      if (controlsRef.current && onCameraChange) {
        const controls = controlsRef.current;
        
        const handleChange = () => {
          onCameraChange(
            camera.position.clone(),
            controls.target.clone()
          );
        };
        
        controls.addEventListener('change', handleChange);
        return () => controls.removeEventListener('change', handleChange);
      }
    }, [camera, onCameraChange]);
    
    // Apply preset when it changes
    useEffect(() => {
      if (preset && cameraPresets[preset]) {
        const { position, target: presetTarget } = cameraPresets[preset];
        camera.position.set(...position);
        if (controlsRef.current) {
          controlsRef.current.target.set(...presetTarget);
          controlsRef.current.update();
        }
      }
    }, [preset, camera]);
    
    // Expose control methods via ref
    const setPreset = useCallback((newPreset: CameraPreset) => {
      const { position, target: presetTarget } = cameraPresets[newPreset];
      camera.position.set(...position);
      if (controlsRef.current) {
        controlsRef.current.target.set(...presetTarget);
        controlsRef.current.update();
      }
    }, [camera]);
    
    const reset = useCallback(() => {
      setPreset('isometric');
    }, [setPreset]);
    
    useImperativeHandle(ref, () => ({
      reset,
      setPreset,
      getCamera: () => camera,
    }), [reset, setPreset, camera]);
    
    return (
      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        enableZoom={enableZoom}
        enablePan={enablePan}
        enableRotate={enableRotate}
        minDistance={minDistance}
        maxDistance={maxDistance}
        target={target}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    );
  }
);

export default SurfaceControls;
