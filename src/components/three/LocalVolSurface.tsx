/**
 * LocalVolSurface - 3D visualization of local volatility surface
 * 
 * Uses Three.js / React Three Fiber for rendering.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { LocalVolSurfaceData } from '@/utils/localVolatility'
import { useTheme } from '@/hooks/useTheme'

// ============================================================================
// Types
// ============================================================================

interface LocalVolSurfaceProps {
  data: LocalVolSurfaceData
  showWireframe?: boolean
  colorScheme?: 'thermal' | 'viridis' | 'plasma'
  autoRotate?: boolean
  highlightATM?: boolean
}

interface SurfaceMeshProps {
  data: LocalVolSurfaceData
  showWireframe: boolean
  colorScheme: keyof typeof colorSchemes
  highlightATM: boolean
}

interface AxisLabelsProps {
  data: LocalVolSurfaceData
}

// ============================================================================
// Color Schemes
// ============================================================================

const colorSchemes = {
  thermal: [
    { pos: 0, color: new THREE.Color('#000033') },
    { pos: 0.25, color: new THREE.Color('#0066cc') },
    { pos: 0.5, color: new THREE.Color('#00cc66') },
    { pos: 0.75, color: new THREE.Color('#ffcc00') },
    { pos: 1, color: new THREE.Color('#ff3300') },
  ],
  viridis: [
    { pos: 0, color: new THREE.Color('#440154') },
    { pos: 0.25, color: new THREE.Color('#3b528b') },
    { pos: 0.5, color: new THREE.Color('#21918c') },
    { pos: 0.75, color: new THREE.Color('#5ec962') },
    { pos: 1, color: new THREE.Color('#fde725') },
  ],
  plasma: [
    { pos: 0, color: new THREE.Color('#0d0887') },
    { pos: 0.25, color: new THREE.Color('#7e03a8') },
    { pos: 0.5, color: new THREE.Color('#cc4778') },
    { pos: 0.75, color: new THREE.Color('#f89540') },
    { pos: 1, color: new THREE.Color('#f0f921') },
  ],
}

function interpolateColor(value: number, scheme: keyof typeof colorSchemes): THREE.Color {
  const stops = colorSchemes[scheme]
  const clampedValue = Math.max(0, Math.min(1, value))
  
  for (let i = 0; i < stops.length - 1; i++) {
    if (clampedValue >= stops[i].pos && clampedValue <= stops[i + 1].pos) {
      const t = (clampedValue - stops[i].pos) / (stops[i + 1].pos - stops[i].pos)
      return stops[i].color.clone().lerp(stops[i + 1].color, t)
    }
  }
  
  return stops[stops.length - 1].color.clone()
}

// ============================================================================
// Surface Mesh Component
// ============================================================================

function SurfaceMesh({ data, showWireframe, colorScheme, highlightATM }: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const geometry = useMemo(() => {
    const { strikes, maturities, points, minLocalVol, maxLocalVol, spotPrice } = data
    
    const width = strikes.length
    const height = maturities.length
    
    if (width < 2 || height < 2) {
      return new THREE.BufferGeometry()
    }
    
    const geom = new THREE.PlaneGeometry(10, 10, width - 1, height - 1)
    const positions = geom.attributes.position.array as Float32Array
    const colors = new Float32Array(positions.length)
    
    // Normalize ranges
    const strikeMin = strikes[0]
    const strikeMax = strikes[strikes.length - 1]
    const matMin = maturities[0]
    const matMax = maturities[maturities.length - 1]
    const volRange = maxLocalVol - minLocalVol || 1
    
    // Build lookup map
    const volMap = new Map<string, number>()
    points.forEach(p => {
      volMap.set(`${p.strike.toFixed(4)}-${p.maturity.toFixed(4)}`, p.localVol)
    })
    
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const idx = j * width + i
        const posIdx = idx * 3
        
        const strike = strikes[i]
        const maturity = maturities[j]
        const localVol = volMap.get(`${strike.toFixed(4)}-${maturity.toFixed(4)}`) ?? minLocalVol
        
        // X: Strike (normalized to -5 to 5)
        positions[posIdx] = ((strike - strikeMin) / (strikeMax - strikeMin) - 0.5) * 10
        
        // Y: Local Vol (height, normalized)
        positions[posIdx + 1] = ((localVol - minLocalVol) / volRange) * 4
        
        // Z: Maturity (normalized to -5 to 5)
        positions[posIdx + 2] = ((maturity - matMin) / (matMax - matMin) - 0.5) * 10
        
        // Color based on local vol
        const normalizedVol = (localVol - minLocalVol) / volRange
        const color = interpolateColor(normalizedVol, colorScheme)
        
        // Highlight ATM region
        const isNearATM = Math.abs(strike - spotPrice) / spotPrice < 0.05
        if (highlightATM && isNearATM) {
          color.multiplyScalar(1.3) // Brighten ATM
        }
        
        colors[posIdx] = color.r
        colors[posIdx + 1] = color.g
        colors[posIdx + 2] = color.b
      }
    }
    
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    
    return geom
  }, [data, colorScheme, highlightATM])
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        wireframe={showWireframe}
        roughness={0.6}
        metalness={0.2}
      />
    </mesh>
  )
}

// ============================================================================
// Axis Labels Component
// ============================================================================

function AxisLabels({ data }: AxisLabelsProps) {
  const { isDark } = useTheme()
  const textColor = isDark ? '#ffffff' : '#000000'
  
  const { strikes, maturities, minLocalVol, maxLocalVol } = data
  
  return (
    <group>
      {/* X-Axis (Strike) Labels */}
      <Text
        position={[0, -1, 6]}
        fontSize={0.4}
        color={textColor}
        anchorX="center"
      >
        Strike
      </Text>
      <Text position={[-5, -0.5, 5.5]} fontSize={0.25} color={textColor}>
        {strikes[0].toFixed(0)}
      </Text>
      <Text position={[5, -0.5, 5.5]} fontSize={0.25} color={textColor}>
        {strikes[strikes.length - 1].toFixed(0)}
      </Text>
      
      {/* Z-Axis (Maturity) Labels */}
      <Text
        position={[6, -1, 0]}
        fontSize={0.4}
        color={textColor}
        anchorX="center"
        rotation={[0, -Math.PI / 2, 0]}
      >
        Maturity (Y)
      </Text>
      <Text position={[5.5, -0.5, -5]} fontSize={0.25} color={textColor}>
        {maturities[0].toFixed(2)}
      </Text>
      <Text position={[5.5, -0.5, 5]} fontSize={0.25} color={textColor}>
        {maturities[maturities.length - 1].toFixed(2)}
      </Text>
      
      {/* Y-Axis (Local Vol) Labels */}
      <Text
        position={[-6, 2, 0]}
        fontSize={0.4}
        color={textColor}
        rotation={[0, Math.PI / 2, Math.PI / 2]}
      >
        Local Vol
      </Text>
      <Text position={[-5.5, 0, 0]} fontSize={0.25} color={textColor}>
        {(minLocalVol * 100).toFixed(0)}%
      </Text>
      <Text position={[-5.5, 4, 0]} fontSize={0.25} color={textColor}>
        {(maxLocalVol * 100).toFixed(0)}%
      </Text>
    </group>
  )
}

// ============================================================================
// Auto Rotate Component
// ============================================================================

function AutoRotate({ enabled }: { enabled: boolean }) {
  const controlsRef = useRef<any>(null)
  
  useFrame(() => {
    if (enabled && controlsRef.current) {
      controlsRef.current.autoRotate = true
      controlsRef.current.autoRotateSpeed = 0.5
    }
  })
  
  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />
}

// ============================================================================
// Main Component
// ============================================================================

export function LocalVolSurface3D({
  data,
  showWireframe = false,
  colorScheme = 'viridis',
  autoRotate = false,
  highlightATM = true,
}: LocalVolSurfaceProps) {
  const { isDark } = useTheme()
  
  if (!data || data.points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No local volatility data available</p>
      </div>
    )
  }
  
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [12, 8, 12], fov: 50 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        gl={{ powerPreference: 'high-performance' }}
        style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        <SurfaceMesh
          data={data}
          showWireframe={showWireframe}
          colorScheme={colorScheme}
          highlightATM={highlightATM}
        />
        
        <AxisLabels data={data} />
        
        <Grid
          args={[20, 20]}
          position={[0, -0.5, 0]}
          cellColor={isDark ? '#475569' : '#94a3b8'}
          sectionColor={isDark ? '#64748b' : '#64748b'}
        />
        
        <AutoRotate enabled={autoRotate} />
      </Canvas>
    </div>
  )
}

export default LocalVolSurface3D
