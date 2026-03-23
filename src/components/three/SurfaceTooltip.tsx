/**
 * SurfaceTooltip - HTML overlay tooltip for 3D surface
 */

import { Html } from '@react-three/drei';
import { formatVolatility, formatCurrency, formatMaturity } from '@/lib/utils';

export interface TooltipData {
  strike: number;
  maturity: number;
  impliedVol: number;
  position: [number, number, number];
}

interface SurfaceTooltipProps {
  data: TooltipData | null;
  visible: boolean;
  spotPrice?: number;
}

export function SurfaceTooltip({ data, visible, spotPrice }: SurfaceTooltipProps) {
  if (!visible || !data) return null;
  
  const moneyness = spotPrice ? (data.strike / spotPrice * 100).toFixed(1) + '%' : null;
  
  return (
    <Html
      position={data.position}
      center
      distanceFactor={10}
      style={{
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
        opacity: visible ? 1 : 0,
        transform: 'translateY(-20px)',
      }}
      zIndexRange={[100, 0]}
    >
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Strike:</span>
            <span className="font-mono font-medium">{formatCurrency(data.strike)}</span>
          </div>
          {moneyness && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Moneyness:</span>
              <span className="font-mono font-medium">{moneyness}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Maturity:</span>
            <span className="font-mono font-medium">{formatMaturity(data.maturity)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-border">
            <span className="text-muted-foreground">IV:</span>
            <span className="font-mono font-medium text-primary">
              {formatVolatility(data.impliedVol)}
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}

/**
 * Simple marker point for selected data point
 */
interface DataPointMarkerProps {
  position: [number, number, number];
  visible: boolean;
  color?: string;
  size?: number;
}

export function DataPointMarker({
  position,
  visible,
  color = '#3B82F6',
  size = 0.08,
}: DataPointMarkerProps) {
  if (!visible) return null;
  
  return (
    <group position={position}>
      {/* Sphere marker */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Vertical line to base */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, -position[1], 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
    </group>
  );
}

export default SurfaceTooltip;
