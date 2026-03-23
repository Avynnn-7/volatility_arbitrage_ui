/**
 * SurfaceExport - Export utilities for 3D surface visualization
 */

import { useThree } from '@react-three/fiber';
import { useCallback, useEffect } from 'react';
import * as THREE from 'three';

interface UseSurfaceExportOptions {
  filename?: string;
  quality?: number;
}

export interface SurfaceExportResult {
  exportImage: (format?: 'png' | 'jpeg') => void;
  exportJSON: () => void;
  captureDataUrl: (format?: 'png' | 'jpeg') => string | null;
}

/**
 * Hook for exporting the surface visualization from within Canvas
 */
export function useSurfaceExport(options: UseSurfaceExportOptions = {}): SurfaceExportResult {
  const { filename = 'volatility-surface', quality = 1 } = options;
  const { gl, scene, camera } = useThree();
  
  const exportImage = useCallback(
    (format: 'png' | 'jpeg' = 'png') => {
      // Ensure we render the latest state
      gl.render(scene, camera);
      
      // Get the canvas data
      const canvas = gl.domElement;
      const dataUrl = canvas.toDataURL(`image/${format}`, quality);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [gl, scene, camera, filename, quality]
  );
  
  const captureDataUrl = useCallback(
    (format: 'png' | 'jpeg' = 'png'): string | null => {
      try {
        gl.render(scene, camera);
        const canvas = gl.domElement;
        return canvas.toDataURL(`image/${format}`, quality);
      } catch (e) {
        console.error('Failed to capture canvas:', e);
        return null;
      }
    },
    [gl, scene, camera, quality]
  );
  
  const exportJSON = useCallback(() => {
    // Export scene as JSON (for debugging or sharing)
    const json = scene.toJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${filename}-scene.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [scene, filename]);
  
  return { exportImage, exportJSON, captureDataUrl };
}

/**
 * Export manager that can be used outside of Canvas
 */
export class SurfaceExportManager {
  private canvasRef: HTMLCanvasElement | null = null;
  private sceneRef: THREE.Scene | null = null;
  private cameraRef: THREE.Camera | null = null;
  private rendererRef: THREE.WebGLRenderer | null = null;
  
  setReferences(
    canvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this.canvasRef = canvas;
    this.sceneRef = scene;
    this.cameraRef = camera;
    this.rendererRef = renderer;
  }
  
  exportPNG(filename = 'volatility-surface'): boolean {
    return this.exportImage('png', filename);
  }
  
  exportJPEG(filename = 'volatility-surface', quality = 0.9): boolean {
    return this.exportImage('jpeg', filename, quality);
  }
  
  private exportImage(
    format: 'png' | 'jpeg',
    filename: string,
    quality = 1
  ): boolean {
    if (!this.canvasRef || !this.sceneRef || !this.cameraRef || !this.rendererRef) {
      console.error('Export references not set');
      return false;
    }
    
    try {
      this.rendererRef.render(this.sceneRef, this.cameraRef);
      const dataUrl = this.canvasRef.toDataURL(`image/${format}`, quality);
      
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (e) {
      console.error('Export failed:', e);
      return false;
    }
  }
  
  getDataUrl(format: 'png' | 'jpeg' = 'png', quality = 1): string | null {
    if (!this.canvasRef || !this.sceneRef || !this.cameraRef || !this.rendererRef) {
      return null;
    }
    
    try {
      this.rendererRef.render(this.sceneRef, this.cameraRef);
      return this.canvasRef.toDataURL(`image/${format}`, quality);
    } catch (e) {
      console.error('Failed to get data URL:', e);
      return null;
    }
  }
}

/**
 * Component to capture export references within Canvas
 */
interface ExportReferenceCaptureProps {
  manager: SurfaceExportManager;
}

export function ExportReferenceCapture({ manager }: ExportReferenceCaptureProps) {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    manager.setReferences(gl.domElement, scene, camera, gl);
  }, [gl, scene, camera, manager]);
  
  return null;
}

/**
 * Helper function to download image from canvas ref
 */
export function downloadCanvasImage(
  canvas: HTMLCanvasElement | null,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  quality = 1
): boolean {
  if (!canvas) return false;
  
  try {
    const dataUrl = canvas.toDataURL(`image/${format}`, quality);
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error('Download failed:', e);
    return false;
  }
}

export default useSurfaceExport;
