/**
 * LocalVolComparison - Charts comparing implied and local volatility
 * 
 * Provides scatter plots, smile comparisons, and term structure views.
 */

import { useMemo, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVolatilityComparison } from '@/hooks/useLocalVolatility'
import { formatPercent } from '@/utils/formatters'
import { useTheme } from '@/hooks/useTheme'

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'scatter' | 'smile' | 'term'

interface ChartColors {
  implied: string
  local: string
  grid: string
  text: string
}

// ============================================================================
// Main Component
// ============================================================================

export function LocalVolComparison() {
  const { comparison } = useVolatilityComparison()
  const { isDark } = useTheme()
  const [view, setView] = useState<ViewMode>('scatter')
  const [selectedMaturity, setSelectedMaturity] = useState<string>('all')
  
  const chartColors: ChartColors = {
    implied: isDark ? '#60a5fa' : '#3b82f6',
    local: isDark ? '#a78bfa' : '#8b5cf6',
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#94a3b8' : '#64748b',
  }
  
  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!comparison) return []
    return comparison.points
      .filter(p => p.isValid)
      .map(p => ({
        impliedVol: p.impliedVol * 100,
        localVol: p.localVol * 100,
        strike: p.strike,
        maturity: p.maturity,
      }))
  }, [comparison])
  
  // Get unique maturities for filtering
  const maturities = useMemo(() => {
    if (!comparison) return []
    const unique = [...new Set(comparison.points.map(p => p.maturity))]
    return unique.sort((a, b) => a - b)
  }, [comparison])
  
  // Smile comparison data (vol vs strike at selected maturity)
  const smileData = useMemo(() => {
    if (!comparison) return []
    
    const filtered = selectedMaturity === 'all'
      ? comparison.points
      : comparison.points.filter(p => p.maturity.toFixed(2) === selectedMaturity)
    
    return filtered
      .filter(p => p.isValid)
      .sort((a, b) => a.strike - b.strike)
      .map(p => ({
        strike: p.strike,
        impliedVol: p.impliedVol * 100,
        localVol: p.localVol * 100,
        maturity: p.maturity,
      }))
  }, [comparison, selectedMaturity])
  
  // Term structure data (vol vs maturity at ATM)
  const termData = useMemo(() => {
    if (!comparison) return []
    
    // Get ATM-ish points (within 5% of spot)
    const spotPrice = comparison.points[0]?.strike ?? 100 // Approximate
    const atmPoints = comparison.points
      .filter(p => p.isValid && Math.abs(p.strike - spotPrice) / spotPrice < 0.05)
      .sort((a, b) => a.maturity - b.maturity)
    
    // Group by maturity and average
    const grouped = new Map<number, { implied: number[]; local: number[] }>()
    atmPoints.forEach(p => {
      const key = p.maturity
      if (!grouped.has(key)) grouped.set(key, { implied: [], local: [] })
      grouped.get(key)!.implied.push(p.impliedVol)
      grouped.get(key)!.local.push(p.localVol)
    })
    
    return Array.from(grouped.entries())
      .map(([maturity, vols]) => ({
        maturity,
        impliedVol: (vols.implied.reduce((a, b) => a + b, 0) / vols.implied.length) * 100,
        localVol: (vols.local.reduce((a, b) => a + b, 0) / vols.local.length) * 100,
      }))
      .sort((a, b) => a.maturity - b.maturity)
  }, [comparison])
  
  if (!comparison) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 dark:text-slate-400">
          No comparison data available
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="scatter">Scatter</TabsTrigger>
            <TabsTrigger value="smile">Vol Smile</TabsTrigger>
            <TabsTrigger value="term">Term Structure</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {view === 'smile' && (
          <Select value={selectedMaturity} onValueChange={setSelectedMaturity}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select maturity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Maturities</SelectItem>
              {maturities.map(m => (
                <SelectItem key={m} value={m.toFixed(2)}>
                  {m.toFixed(2)}Y
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="text-slate-500 dark:text-slate-400">Avg Implied</div>
          <div className="font-semibold text-blue-600 dark:text-blue-400">
            {formatPercent(comparison.avgImplied)}
          </div>
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="text-slate-500 dark:text-slate-400">Avg Local</div>
          <div className="font-semibold text-purple-600 dark:text-purple-400">
            {formatPercent(comparison.avgLocal)}
          </div>
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="text-slate-500 dark:text-slate-400">Avg Diff</div>
          <div className="font-semibold">
            {comparison.avgDiff > 0 ? '+' : ''}{formatPercent(comparison.avgDiff)}
          </div>
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="text-slate-500 dark:text-slate-400">Max Diff</div>
          <div className="font-semibold">
            {formatPercent(comparison.maxDiff)}
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="h-[350px]">
        {view === 'scatter' && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="impliedVol"
                type="number"
                name="Implied Vol"
                unit="%"
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{ value: 'Implied Vol (%)', position: 'bottom', fill: chartColors.text }}
              />
              <YAxis
                dataKey="localVol"
                type="number"
                name="Local Vol"
                unit="%"
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{ value: 'Local Vol (%)', angle: -90, position: 'left', fill: chartColors.text }}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-medium">K: {data.strike.toFixed(2)}, T: {data.maturity.toFixed(2)}</p>
                      <p className="text-blue-600">Implied: {data.impliedVol.toFixed(2)}%</p>
                      <p className="text-purple-600">Local: {data.localVol.toFixed(2)}%</p>
                    </div>
                  )
                }}
              />
              <ReferenceLine
                segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                stroke={chartColors.text}
                strokeDasharray="5 5"
                label="y=x"
              />
              <Scatter
                name="Vol Points"
                data={scatterData}
                fill={chartColors.local}
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
        
        {view === 'smile' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={smileData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="strike"
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{ value: 'Strike', position: 'bottom', fill: chartColors.text }}
              />
              <YAxis
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{ value: 'Volatility (%)', angle: -90, position: 'left', fill: chartColors.text }}
              />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-medium">Strike: {label}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} style={{ color: p.color }}>
                          {p.name}: {p.value?.toFixed(2)}%
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="impliedVol"
                name="Implied Vol"
                stroke={chartColors.implied}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="localVol"
                name="Local Vol"
                stroke={chartColors.local}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {view === 'term' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={termData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="maturity"
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{ value: 'Maturity (Years)', position: 'bottom', fill: chartColors.text }}
              />
              <YAxis
                tick={{ fill: chartColors.text, fontSize: 12 }}
                label={{ value: 'Volatility (%)', angle: -90, position: 'left', fill: chartColors.text }}
              />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-medium">Maturity: {Number(label).toFixed(2)}Y</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} style={{ color: p.color }}>
                          {p.name}: {p.value?.toFixed(2)}%
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="impliedVol"
                name="Implied Vol"
                stroke={chartColors.implied}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="localVol"
                name="Local Vol"
                stroke={chartColors.local}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default LocalVolComparison
