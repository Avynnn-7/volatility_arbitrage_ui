/**
 * SurfaceViewerPage - Complete 3D volatility surface viewer
 */

import { useState, useCallback, useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/common/Spinner';

import type { CameraPreset, TooltipData } from '@/components/three';
import {
  VolatilitySurface,
  VolatilitySurfaceWireframe,
  SurfaceAxes,
  SurfaceGrid,
  SurfaceTooltip,
  SurfaceColorLegend,
  SurfaceComparison,
  AnimatedSurface,
  cameraPresets,
  ExportControls,
} from '@/components/three';

import { SurfaceViewerControls } from './SurfaceViewerControls';
import { useSurfaceData } from '@/hooks/useSurfaceData';
import { useSurfaceInteraction } from '@/hooks/useSurfaceInteraction';
import type { ColorScaleName } from '@/utils/colorScales';
import type { SurfaceDataPoint } from '@/utils/surfaceGeometry';

// Inner scene component that uses Three.js hooks
interface SurfaceSceneContentProps {
  surfaceData: SurfaceDataPoint[];
  correctedData?: SurfaceDataPoint[];
  colorScale: ColorScaleName;
  showWireframe: boolean;
  showAxes: boolean;
  showGrid: boolean;
  animate: boolean;
  comparisonMode: 'single' | 'overlay' | 'sideBySide';
  cameraPreset: CameraPreset;
  strikeRange: [number, number];
  maturityRange: [number, number];
  volRange: [number, number];
  onTooltipChange: (data: TooltipData | null) => void;
}

function SurfaceSceneContent({
  surfaceData,
  correctedData,
  colorScale,
  showWireframe,
  showAxes,
  showGrid,
  animate,
  comparisonMode,
  cameraPreset,
  strikeRange,
  maturityRange,
  volRange,
  onTooltipChange,
}: SurfaceSceneContentProps) {
  const { gridData: _gridData } = useSurfaceData({ data: surfaceData });
  
  const {
    hoveredPoint,
    handlePointerMove,
    handlePointerOut,
  } = useSurfaceInteraction({
    data: surfaceData,
    gridData: _gridData,
  });
  
  // Update tooltip in parent
  useEffect(() => {
    onTooltipChange(hoveredPoint);
  }, [hoveredPoint, onTooltipChange]);
  
  const handleSurfacePointerMove = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.intersections?.[0]) {
        handlePointerMove(e.intersections[0]);
      }
    },
    [handlePointerMove]
  );
  
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={cameraPresets[cameraPreset].position}
        fov={50}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 10, 0]} intensity={0.3} />
      <Environment preset="city" />
      
      {/* Grid */}
      {showGrid && <SurfaceGrid />}
      
      {/* Axes */}
      {showAxes && (
        <SurfaceAxes
          strikeRange={strikeRange}
          maturityRange={maturityRange}
          volRange={volRange}
        />
      )}
      
      {/* Surface(s) */}
      {comparisonMode === 'single' ? (
        <AnimatedSurface animate={animate}>
          <VolatilitySurface
            data={surfaceData}
            useVertexColors={true}
            colorScale={colorScale}
            onPointerMove={handleSurfacePointerMove}
            onPointerOut={handlePointerOut}
          />
          {showWireframe && (
            <VolatilitySurfaceWireframe
              data={surfaceData}
              color="#ffffff"
              opacity={0.3}
            />
          )}
        </AnimatedSurface>
      ) : (
        correctedData && (
          <SurfaceComparison
            originalData={surfaceData}
            correctedData={correctedData}
            mode={comparisonMode === 'overlay' ? 'overlay' : 'sideBySide'}
            colorScale={colorScale}
          />
        )
      )}
      
      {/* Tooltip */}
      <SurfaceTooltip data={hoveredPoint} visible={!!hoveredPoint} />
      
      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={30}
        target={cameraPresets[cameraPreset].target}
      />
    </>
  );
}

export function SurfaceViewerPage() {
  // State
  const [colorScale, setColorScale] = useState<ColorScaleName>('volatility');
  const [showWireframe, setShowWireframe] = useState(false);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'single' | 'overlay' | 'sideBySide'>('single');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  
  // Canvas ref for export
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Mock data for development
  // In production, replace with data from useVolSurface hook or API
  const surfaceData = useMemo(() => generateMockSurfaceData(), []);
  const correctedData = useMemo(() => generateMockCorrectedData(surfaceData), [surfaceData]);
  const isLoading = false;
  
  const {
    gridData: _gridData,
    strikeRange,
    maturityRange,
    volRange,
    isDownsampled,
    displayCount,
    originalCount,
    stats,
  } = useSurfaceData({ data: surfaceData });
  
  // Export handlers
  const handleExportPNG = useCallback(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      downloadImage(dataUrl, 'volatility-surface.png');
    }
  }, []);
  
  const handleExportJPEG = useCallback(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      downloadImage(dataUrl, 'volatility-surface.jpg');
    }
  }, []);
  
  return (
    <PageLayout
      title="3D Volatility Surface"
      description="Interactive visualization of the implied volatility surface"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <SurfaceViewerControls
            colorScale={colorScale}
            onColorScaleChange={setColorScale}
            showWireframe={showWireframe}
            onShowWireframeChange={setShowWireframe}
            showAxes={showAxes}
            onShowAxesChange={setShowAxes}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            animate={animate}
            onAnimateChange={setAnimate}
            comparisonMode={comparisonMode}
            onComparisonModeChange={setComparisonMode}
            cameraPreset={cameraPreset}
            onCameraPresetChange={setCameraPreset}
          />
          
          {/* Data Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Surface Statistics</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points:</span>
                <span className="font-mono">{displayCount.toLocaleString()}</span>
              </div>
              {isDownsampled && (
                <div className="flex justify-between text-yellow-500">
                  <span>Original:</span>
                  <span className="font-mono">{originalCount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strike Range:</span>
                <span className="font-mono">${strikeRange[0]} - ${strikeRange[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maturity:</span>
                <span className="font-mono">{maturityRange[0].toFixed(2)}Y - {maturityRange[1].toFixed(2)}Y</span>
              </div>
              {stats && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IV Range:</span>
                    <span className="font-mono">{(stats.min * 100).toFixed(1)}% - {(stats.max * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ATM Vol:</span>
                    <span className="font-mono text-primary">{(stats.atmVol * 100).toFixed(2)}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Hovered Point Info */}
          {tooltipData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Selected Point</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strike:</span>
                  <span className="font-mono">${tooltipData.strike.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maturity:</span>
                  <span className="font-mono">{tooltipData.maturity.toFixed(3)}Y</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IV:</span>
                  <span className="font-mono text-primary">{(tooltipData.impliedVol * 100).toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Export */}
          <ExportControls
            onExportPNG={handleExportPNG}
            onExportJPEG={handleExportJPEG}
            className="w-full"
          />
        </div>
        
        {/* 3D Canvas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-[600px] w-full bg-[#0a0a0f]">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <Canvas
                    onCreated={(state) => {
                      canvasRef.current = state.gl.domElement;
                    }}
                    shadows
                    dpr={[1, 2]}
                    performance={{ min: 0.5 }}
                    gl={{
                      antialias: true,
                      preserveDrawingBuffer: true,
                      toneMapping: THREE.ACESFilmicToneMapping,
                      toneMappingExposure: 1.2,
                      powerPreference: 'high-performance',
                    }}
                  >
                    <Suspense fallback={null}>
                      <SurfaceSceneContent
                        surfaceData={surfaceData}
                        correctedData={correctedData}
                        colorScale={colorScale}
                        showWireframe={showWireframe}
                        showAxes={showAxes}
                        showGrid={showGrid}
                        animate={animate}
                        comparisonMode={comparisonMode}
                        cameraPreset={cameraPreset}
                        strikeRange={strikeRange}
                        maturityRange={maturityRange}
                        volRange={volRange}
                        onTooltipChange={setTooltipData}
                      />
                    </Suspense>
                  </Canvas>
                )}
                
                {/* Color Legend Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                  <SurfaceColorLegend
                    scale={colorScale}
                    minValue={volRange[0]}
                    maxValue={volRange[1]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

// Helper function to download image
function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Mock data generator for development
function generateMockSurfaceData(): SurfaceDataPoint[] {
  const data: SurfaceDataPoint[] = [];
  const strikes = [80, 85, 90, 95, 100, 105, 110, 115, 120];
  const maturities = [0.083, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
  
  for (const strike of strikes) {
    for (const maturity of maturities) {
      // Generate realistic smile pattern
      const moneyness = Math.log(strike / 100);
      const baseVol = 0.2;
      const skew = -0.1 * moneyness;
      const smile = 0.02 * moneyness * moneyness;
      const termStructure = 0.01 * Math.sqrt(maturity);
      
      const impliedVol = baseVol + skew + smile + termStructure + Math.random() * 0.01;
      
      data.push({ strike, maturity, impliedVol });
    }
  }
  
  return data;
}

// Generate corrected data with slightly smoothed values
function generateMockCorrectedData(original: SurfaceDataPoint[]): SurfaceDataPoint[] {
  return original.map((p) => ({
    ...p,
    impliedVol: p.impliedVol + (Math.random() - 0.5) * 0.005, // Small random adjustments
  }));
}

export default SurfaceViewerPage;
