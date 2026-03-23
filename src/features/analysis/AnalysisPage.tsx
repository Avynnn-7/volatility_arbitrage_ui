import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Box,
  Compass,
  Layers,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react'

const analysisTools = [
  {
    icon: Shield,
    title: 'Arbitrage Detection',
    description:
      'Detect butterfly, calendar, and vertical spread arbitrage violations in your volatility surface with configurable tolerances.',
    link: '/wizard',
    linkLabel: 'Run in Wizard',
    color: 'from-red-500 to-orange-500',
    bgColor: 'from-red-500/5 to-orange-500/5',
  },
  {
    icon: Zap,
    title: 'QP Surface Correction',
    description:
      'Project your implied volatility surface onto the arbitrage-free cone using quadratic programming with minimal distortion.',
    link: '/wizard',
    linkLabel: 'Run in Wizard',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'from-amber-500/5 to-yellow-500/5',
  },
  {
    icon: Box,
    title: '3D Surface Viewer',
    description:
      'Interactively explore the volatility surface in 3D with rotation, zoom, and color-coded implied volatility levels.',
    link: '/surface',
    linkLabel: 'Open Viewer',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/5 to-cyan-500/5',
  },
  {
    icon: Layers,
    title: 'Local Volatility (Dupire)',
    description:
      'Compute the Dupire local volatility surface from the arbitrage-free implied vol surface to verify arbitrage conditions.',
    link: '/localvol',
    linkLabel: 'Compute Local Vol',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'from-purple-500/5 to-violet-500/5',
  },
]

const stats = [
  {
    label: 'Violation Types',
    value: '3',
    detail: 'Butterfly • Calendar • Vertical',
    icon: Activity,
  },
  {
    label: 'QP Solver',
    value: 'OSQP',
    detail: 'Optimal • Sub-ms latency',
    icon: TrendingUp,
  },
  {
    label: 'Surface Grid',
    value: 'N×M',
    detail: 'Arbitrary strike/expiry grids',
    icon: BarChart3,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function AnalysisPage() {
  return (
    <PageLayout
      title="Analysis Tools"
      description="Comprehensive volatility surface analytics and arbitrage correction"
    >
      <div className="space-y-8">
        {/* Stats row */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="bg-surface-800/50 border-surface-700/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-primary-500/10">
                      <Icon className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-surface-100">{stat.value}</span>
                        <span className="text-sm text-surface-400">{stat.label}</span>
                      </div>
                      <p className="text-xs text-surface-500">{stat.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Analysis tool cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {analysisTools.map((tool) => {
            const Icon = tool.icon
            return (
              <motion.div key={tool.title} variants={itemVariants}>
                <Card className={`group bg-gradient-to-br ${tool.bgColor} bg-surface-800/50 border-surface-700/50 hover:border-surface-600/70 transition-all duration-300 h-full`}>
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color} shadow-lg`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-surface-100 mb-1">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-surface-400 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <Link
                        to={tool.link}
                        className="inline-flex items-center text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors group-hover:underline"
                      >
                        {tool.linkLabel}
                        <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Quick start CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 text-center"
        >
          <h3 className="text-lg font-semibold mb-2">Ready to Analyze?</h3>
          <p className="text-surface-400 text-sm mb-5 max-w-xl mx-auto">
            The Analysis Wizard guides you through uploading data, detecting violations, and
            correcting your surface — all in one workflow.
          </p>
          <Link to="/wizard" className="btn-primary px-6 py-2.5">
            <Compass className="h-5 w-5 mr-2" />
            Launch Wizard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </motion.div>
      </div>
    </PageLayout>
  )
}
