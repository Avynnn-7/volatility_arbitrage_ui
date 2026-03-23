/**
 * ArbitrageHighlights - Visual markers for arbitrage violations on the surface
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

export interface ArbitrageViolation {
  type: 'calendar' | 'butterfly' | 'vertical';
  strike1: number;
  strike2?: number;
  strike3?: number;
  maturity1: number;
  maturity2?: number;
  severity: number; // 0-1
  message?: string;
}

interface ArbitrageHighlightsProps {
  violations: ArbitrageViolation[];
  strikeRange: [number, number];
  maturityRange: [number, number];
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  baseHeight?: number;
  animate?: boolean;
  showLabels?: boolean;
}

export function ArbitrageHighlights({
  violations,
  strikeRange,
  maturityRange,
  scaleX = 6,
  scaleY: _scaleY = 4,
  scaleZ = 6,
  baseHeight = 0.5,
  animate = true,
  showLabels = false,
}: ArbitrageHighlightsProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Pulse animation
  useFrame((state) => {
    if (!animate || !groupRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    groupRef.current.children.forEach((child) => {
      if (child.type === 'Group') {
        child.scale.setScalar(pulse);
      }
    });
  });
  
  const highlights = useMemo(() => {
    return violations.map((violation, index) => {
      // Normalize positions
      const x1 = normalizeValue(violation.strike1, strikeRange[0], strikeRange[1], scaleX);
      const z1 = normalizeValue(violation.maturity1, maturityRange[0], maturityRange[1], scaleZ);
      
      const position1: [number, number, number] = [x1, baseHeight, z1];
      
      // Second position for spread violations
      let position2: [number, number, number] | null = null;
      if (violation.strike2 !== undefined && violation.maturity2 !== undefined) {
        const x2 = normalizeValue(violation.strike2, strikeRange[0], strikeRange[1], scaleX);
        const z2 = normalizeValue(violation.maturity2, maturityRange[0], maturityRange[1], scaleZ);
        position2 = [x2, baseHeight, z2];
      }
      
      // Third position for butterfly spreads
      let position3: [number, number, number] | null = null;
      if (violation.strike3 !== undefined) {
        const x3 = normalizeValue(violation.strike3, strikeRange[0], strikeRange[1], scaleX);
        position3 = [x3, baseHeight, z1]; // Same maturity as position1
      }
      
      // Color based on severity
      const color = getViolationColor(violation.severity);
      
      return {
        id: index,
        type: violation.type,
        position1,
        position2,
        position3,
        color,
        severity: violation.severity,
        message: violation.message,
      };
    });
  }, [violations, strikeRange, maturityRange, scaleX, scaleZ, baseHeight]);
  
  return (
    <group ref={groupRef}>
      {highlights.map((highlight) => (
        <group key={highlight.id}>
          {/* Primary violation point */}
          <ViolationMarker
            position={highlight.position1}
            color={highlight.color}
            severity={highlight.severity}
            type={highlight.type}
          />
          
          {/* Connection line for calendar spreads */}
          {highlight.position2 && (
            <>
              <Line
                points={[highlight.position1, highlight.position2]}
                color={highlight.color}
                lineWidth={2}
                dashed
                dashSize={0.1}
                gapSize={0.05}
              />
              <ViolationMarker
                position={highlight.position2}
                color={highlight.color}
                severity={highlight.severity}
                type={highlight.type}
              />
            </>
          )}
          
          {/* Third point for butterfly spreads */}
          {highlight.position3 && (
            <>
              <Line
                points={[highlight.position1, highlight.position3]}
                color={highlight.color}
                lineWidth={2}
                dashed
                dashSize={0.1}
                gapSize={0.05}
              />
              <ViolationMarker
                position={highlight.position3}
                color={highlight.color}
                severity={highlight.severity}
                type={highlight.type}
              />
            </>
          )}
          
          {/* Label */}
          {showLabels && highlight.message && (
            <Billboard
              position={[
                highlight.position1[0],
                highlight.position1[1] + 0.4,
                highlight.position1[2],
              ]}
            >
              <Text
                fontSize={0.15}
                color={highlight.color}
                anchorX="center"
                anchorY="middle"
              >
                {highlight.message}
              </Text>
            </Billboard>
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * Individual violation marker
 */
interface ViolationMarkerProps {
  position: [number, number, number];
  color: string;
  severity: number;
  type: 'calendar' | 'butterfly' | 'vertical';
}

function ViolationMarker({ position, color, severity, type }: ViolationMarkerProps) {
  const size = 0.1 + severity * 0.1;
  
  return (
    <group position={position}>
      {/* Main sphere */}
      <Sphere args={[size, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </Sphere>
      
      {/* Pulsing ring effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.5, size * 2.5, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Type indicator shape */}
      {type === 'calendar' && (
        <mesh rotation={[Math.PI / 4, 0, 0]} position={[0, 0.2, 0]}>
          <torusGeometry args={[0.05, 0.02, 8, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
      
      {type === 'butterfly' && (
        <mesh position={[0, 0.2, 0]}>
          <octahedronGeometry args={[0.05]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

function normalizeValue(
  value: number,
  min: number,
  max: number,
  scale: number
): number {
  const range = max - min || 1;
  return ((value - min) / range - 0.5) * scale;
}

function getViolationColor(severity: number): string {
  // Interpolate from yellow (low) to red (high)
  if (severity < 0.33) return '#fbbf24'; // Yellow
  if (severity < 0.66) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Summary component for violation counts
 */
interface ArbitrageSummaryProps {
  violations: ArbitrageViolation[];
  className?: string;
}

export function ArbitrageSummary({ violations, className }: ArbitrageSummaryProps) {
  const counts = useMemo(() => {
    const result = { calendar: 0, butterfly: 0, vertical: 0, total: violations.length };
    violations.forEach((v) => {
      result[v.type]++;
    });
    return result;
  }, [violations]);
  
  const avgSeverity = useMemo(() => {
    if (violations.length === 0) return 0;
    return violations.reduce((sum, v) => sum + v.severity, 0) / violations.length;
  }, [violations]);
  
  return (
    <div className={className}>
      <div className="text-sm font-medium mb-2">Arbitrage Violations</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>Total: <span className="font-mono">{counts.total}</span></div>
        <div>Severity: <span className="font-mono">{(avgSeverity * 100).toFixed(1)}%</span></div>
        <div>Calendar: <span className="font-mono">{counts.calendar}</span></div>
        <div>Butterfly: <span className="font-mono">{counts.butterfly}</span></div>
        <div>Vertical: <span className="font-mono">{counts.vertical}</span></div>
      </div>
    </div>
  );
}

export default ArbitrageHighlights;
