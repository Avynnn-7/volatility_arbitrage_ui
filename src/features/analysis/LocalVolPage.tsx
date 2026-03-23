/**
 * Local Volatility Surface Page
 * 
 * Full implementation of Dupire local volatility visualization and analysis.
 */

import { useState } from 'react'
import { PageLayout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LocalVolSurface3D } from '@/components/three/LocalVolSurface'
import { LocalVolComparison } from './LocalVolComparison'
import { useLocalVolatility, useVolatilityComparison } from '@/hooks/useLocalVolatility'
import { formatPercent, formatNumber } from '@/utils/formatters'
import { 
  Activity, 
  BarChart3, 
  Settings2, 
  Download,
  RefreshCw,
  Info
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

type ColorScheme = 'thermal' | 'viridis' | 'plasma'

// ============================================================================
// Main Component
// ============================================================================

export function LocalVolPage() {
  // Local vol calculation parameters
  const [riskFreeRate, setRiskFreeRate] = useState(0.05)
  const [dividendYield, setDividendYield] = useState(0.02)
  
  const { localVolSurface, isCalculating, error, stats, recalculate } = useLocalVolatility({
    riskFreeRate,
    dividendYield
  })
  
  const { comparison } = useVolatilityComparison()
  
  // Visualization settings
  const [colorScheme, setColorScheme] = useState<ColorScheme>('viridis')
  const [showWireframe, setShowWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [highlightATM, setHighlightATM] = useState(true)
  const [activeTab, setActiveTab] = useState('surface')
  
  const handleRecalculate = () => {
    recalculate({ riskFreeRate, dividendYield })
  }
  
  const handleExport = () => {
    if (!localVolSurface) return
    
    const exportData = {
      metadata: {
        spotPrice: localVolSurface.spotPrice,
        riskFreeRate: localVolSurface.riskFreeRate,
        dividendYield: localVolSurface.dividendYield,
        calculatedAt: new Date().toISOString()
      },
      statistics: stats,
      points: localVolSurface.points
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `local_volatility_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <PageLayout
      title="Local Volatility Surface"
      description="Dupire local volatility derived from implied volatility surface"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={isCalculating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button onClick={handleExport} disabled={!localVolSurface}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        
        {/* Error display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">Mean Local Vol</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatPercent(stats.mean)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">ATM Local Vol</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPercent(stats.atmLocalVol)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">Std Dev</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatPercent(stats.std)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">Skewness</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(stats.skew, 3)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">Valid Points</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.validPoints}/{stats.totalPoints}
                </div>
              </CardContent>
            </Card>
            
            {comparison && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Correlation</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatNumber(comparison.correlation, 3)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Main content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure calculation and visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calculation Parameters */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  Calculation Parameters
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Risk-Free Rate</Label>
                    <span className="text-sm text-slate-500">
                      {formatPercent(riskFreeRate)}
                    </span>
                  </div>
                  <Slider
                    value={[riskFreeRate * 100]}
                    onValueChange={([v]) => setRiskFreeRate(v / 100)}
                    min={0}
                    max={15}
                    step={0.25}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Dividend Yield</Label>
                    <span className="text-sm text-slate-500">
                      {formatPercent(dividendYield)}
                    </span>
                  </div>
                  <Slider
                    value={[dividendYield * 100]}
                    onValueChange={([v]) => setDividendYield(v / 100)}
                    min={0}
                    max={10}
                    step={0.25}
                  />
                </div>
              </div>
              
              {/* Visualization Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  Visualization
                </h4>
                
                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <Select value={colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viridis">Viridis</SelectItem>
                      <SelectItem value="thermal">Thermal</SelectItem>
                      <SelectItem value="plasma">Plasma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Wireframe Mode</Label>
                  <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Auto Rotate</Label>
                  <Switch checked={autoRotate} onCheckedChange={setAutoRotate} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Highlight ATM</Label>
                  <Switch checked={highlightATM} onCheckedChange={setHighlightATM} />
                </div>
              </div>
              
              {/* Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Local volatility is calculated using Dupire's formula, which derives 
                    the instantaneous volatility from the implied volatility surface.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Visualization Panel */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="surface" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    3D Surface
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Comparison
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="surface" className="h-[500px] mt-0">
                  {localVolSurface ? (
                    <LocalVolSurface3D
                      data={localVolSurface}
                      showWireframe={showWireframe}
                      colorScheme={colorScheme}
                      autoRotate={autoRotate}
                      highlightATM={highlightATM}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">
                        {isCalculating ? 'Calculating local volatility...' : 'No surface data available. Upload data in the Analysis Wizard first.'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="comparison" className="h-[500px] mt-0">
                  <LocalVolComparison />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

export default LocalVolPage
