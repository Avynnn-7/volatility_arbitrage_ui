/**
 * SurfaceViewerControls - Control panel for 3D surface viewer
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ColorScaleName } from '@/utils/colorScales';
import type { CameraPreset } from '@/components/three';
import { RotateCcw, Palette, Eye, Camera, Layers } from 'lucide-react';

interface SurfaceViewerControlsProps {
  colorScale: ColorScaleName;
  onColorScaleChange: (scale: ColorScaleName) => void;
  showWireframe: boolean;
  onShowWireframeChange: (show: boolean) => void;
  showAxes: boolean;
  onShowAxesChange: (show: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  animate: boolean;
  onAnimateChange: (animate: boolean) => void;
  comparisonMode: 'single' | 'overlay' | 'sideBySide';
  onComparisonModeChange: (mode: 'single' | 'overlay' | 'sideBySide') => void;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
}

export function SurfaceViewerControls({
  colorScale,
  onColorScaleChange,
  showWireframe,
  onShowWireframeChange,
  showAxes,
  onShowAxesChange,
  showGrid,
  onShowGridChange,
  animate,
  onAnimateChange,
  comparisonMode,
  onComparisonModeChange,
  cameraPreset,
  onCameraPresetChange,
}: SurfaceViewerControlsProps) {
  const handleReset = () => {
    onColorScaleChange('volatility');
    onShowWireframeChange(false);
    onShowAxesChange(true);
    onShowGridChange(true);
    onAnimateChange(false);
    onComparisonModeChange('single');
    onCameraPresetChange('isometric');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Visualization Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Scale */}
        <div className="space-y-2">
          <Label className="text-sm">Color Scale</Label>
          <Select 
            value={colorScale} 
            onValueChange={(v) => onColorScaleChange(v as ColorScaleName)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volatility">Volatility (Custom)</SelectItem>
              <SelectItem value="plasma">Plasma</SelectItem>
              <SelectItem value="viridis">Viridis</SelectItem>
              <SelectItem value="inferno">Inferno</SelectItem>
              <SelectItem value="magma">Magma</SelectItem>
              <SelectItem value="coolwarm">Cool-Warm</SelectItem>
              <SelectItem value="thermal">Thermal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Camera Preset */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Camera className="h-3 w-3" />
            Camera View
          </Label>
          <Select 
            value={cameraPreset} 
            onValueChange={(v) => onCameraPresetChange(v as CameraPreset)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="isometric">Isometric</SelectItem>
              <SelectItem value="front">Front</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="side">Side</SelectItem>
              <SelectItem value="corner">Corner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Display Options */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <Eye className="h-3 w-3" />
            Display Options
          </Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="wireframe" className="text-sm font-normal cursor-pointer">
              Show Wireframe
            </Label>
            <Switch
              id="wireframe"
              checked={showWireframe}
              onCheckedChange={onShowWireframeChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="axes" className="text-sm font-normal cursor-pointer">
              Show Axes
            </Label>
            <Switch
              id="axes"
              checked={showAxes}
              onCheckedChange={onShowAxesChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="grid" className="text-sm font-normal cursor-pointer">
              Show Grid
            </Label>
            <Switch
              id="grid"
              checked={showGrid}
              onCheckedChange={onShowGridChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="animate" className="text-sm font-normal cursor-pointer">
              Animate Surface
            </Label>
            <Switch
              id="animate"
              checked={animate}
              onCheckedChange={onAnimateChange}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Comparison Mode */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Layers className="h-3 w-3" />
            Comparison Mode
          </Label>
          <Select
            value={comparisonMode}
            onValueChange={(v) => onComparisonModeChange(v as 'single' | 'overlay' | 'sideBySide')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Surface</SelectItem>
              <SelectItem value="overlay">Overlay (Original + Corrected)</SelectItem>
              <SelectItem value="sideBySide">Side by Side</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Reset Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleReset}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </CardContent>
    </Card>
  );
}

export default SurfaceViewerControls;
