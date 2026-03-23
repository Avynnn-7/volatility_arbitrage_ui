/**
 * SurfaceAxes - 3D axis labels for the volatility surface
 */

import { Text, Line } from '@react-three/drei';

interface SurfaceAxesProps {
  strikeRange: [number, number];
  maturityRange: [number, number];
  volRange: [number, number];
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  showLabels?: boolean;
  showTicks?: boolean;
  color?: string;
}

export function SurfaceAxes({
  strikeRange,
  maturityRange,
  volRange,
  scaleX = 6,
  scaleY = 4,
  scaleZ = 6,
  showLabels = true,
  showTicks = true,
  color = '#888888',
}: SurfaceAxesProps) {
  const halfX = scaleX / 2;
  const halfZ = scaleZ / 2;
  
  // Generate tick values
  const strikeTicks = generateTicks(strikeRange[0], strikeRange[1], 5);
  const maturityTicks = generateTicks(maturityRange[0], maturityRange[1], 5);
  const volTicks = generateTicks(volRange[0], volRange[1], 5);
  
  return (
    <group>
      {/* X-axis (Strike) */}
      <Line
        points={[[-halfX, 0, halfZ], [halfX, 0, halfZ]]}
        color={color}
        lineWidth={2}
      />
      {showLabels && (
        <Text
          position={[0, -0.3, halfZ + 0.8]}
          fontSize={0.3}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          Strike
        </Text>
      )}
      {showTicks && strikeTicks.map((tick, i) => {
        const x = ((tick - strikeRange[0]) / (strikeRange[1] - strikeRange[0]) - 0.5) * scaleX;
        return (
          <group key={`strike-${i}`}>
            <Line
              points={[[x, 0, halfZ], [x, 0, halfZ + 0.15]]}
              color={color}
              lineWidth={1}
            />
            <Text
              position={[x, -0.15, halfZ + 0.4]}
              fontSize={0.2}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {formatTickLabel(tick)}
            </Text>
          </group>
        );
      })}
      
      {/* Z-axis (Maturity) */}
      <Line
        points={[[-halfX, 0, -halfZ], [-halfX, 0, halfZ]]}
        color={color}
        lineWidth={2}
      />
      {showLabels && (
        <Text
          position={[-halfX - 0.8, -0.3, 0]}
          fontSize={0.3}
          color={color}
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI / 2, 0]}
        >
          Maturity
        </Text>
      )}
      {showTicks && maturityTicks.map((tick, i) => {
        const z = ((tick - maturityRange[0]) / (maturityRange[1] - maturityRange[0]) - 0.5) * scaleZ;
        return (
          <group key={`maturity-${i}`}>
            <Line
              points={[[-halfX, 0, z], [-halfX - 0.15, 0, z]]}
              color={color}
              lineWidth={1}
            />
            <Text
              position={[-halfX - 0.4, -0.15, z]}
              fontSize={0.2}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {formatMaturityLabel(tick)}
            </Text>
          </group>
        );
      })}
      
      {/* Y-axis (Implied Vol) */}
      <Line
        points={[[-halfX, 0, halfZ], [-halfX, scaleY, halfZ]]}
        color={color}
        lineWidth={2}
      />
      {showLabels && (
        <Text
          position={[-halfX - 0.5, scaleY / 2, halfZ + 0.5]}
          fontSize={0.3}
          color={color}
          anchorX="center"
          anchorY="middle"
          rotation={[0, 0, Math.PI / 2]}
        >
          IV
        </Text>
      )}
      {showTicks && volTicks.map((tick, i) => {
        const y = ((tick - volRange[0]) / (volRange[1] - volRange[0])) * scaleY;
        return (
          <group key={`vol-${i}`}>
            <Line
              points={[[-halfX, y, halfZ], [-halfX - 0.15, y, halfZ]]}
              color={color}
              lineWidth={1}
            />
            <Text
              position={[-halfX - 0.4, y, halfZ]}
              fontSize={0.2}
              color={color}
              anchorX="right"
              anchorY="middle"
            >
              {(tick * 100).toFixed(0)}%
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function generateTicks(min: number, max: number, count: number): number[] {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

function formatTickLabel(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(0);
}

function formatMaturityLabel(years: number): string {
  if (years < 1/12) return `${Math.round(years * 365)}D`;
  if (years < 1) return `${Math.round(years * 12)}M`;
  return `${years.toFixed(1)}Y`;
}

export default SurfaceAxes;
