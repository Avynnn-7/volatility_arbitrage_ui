/**
 * SurfaceGrid - Ground grid for the 3D scene
 */

import { Grid } from '@react-three/drei';

interface SurfaceGridProps {
  size?: number;
  divisions?: number;
  cellColor?: string;
  sectionColor?: string;
  fadeDistance?: number;
  position?: [number, number, number];
  infiniteGrid?: boolean;
}

export function SurfaceGrid({
  size = 20,
  divisions = 20,
  cellColor = '#333340',
  sectionColor = '#222230',
  fadeDistance = 30,
  position = [0, -0.01, 0],
  infiniteGrid = true,
}: SurfaceGridProps) {
  return (
    <Grid
      position={position}
      args={[size, size]}
      cellSize={size / divisions}
      cellThickness={0.5}
      cellColor={cellColor}
      sectionSize={size / 4}
      sectionThickness={1}
      sectionColor={sectionColor}
      fadeDistance={fadeDistance}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={infiniteGrid}
    />
  );
}

export default SurfaceGrid;
