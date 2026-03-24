import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Compass,
  GitCompare,
  Shield,
  Zap,
} from 'lucide-react'
import { PageLayout } from '@/components/layout'

const features = [
  {
    icon: Activity,
    title: '3D Volatility Surface',
    description:
      'Interactive Three.js visualization with smooth rotation, zoom, and color-coded IV levels.',
    color: 'from-primary-500 to-primary-600',
    link: '/surface',
  },
  {
    icon: Shield,
    title: 'Arbitrage Detection',
    description:
      'Advanced butterfly and calendar spread violation detection with severity scoring.',
    color: 'from-accent-500 to-accent-600',
    link: '/analysis',
  },
  {
    icon: Zap,
    title: 'Live Scanner',
    description:
      'Real-time Upstox API integration for instant NSE/BSE arbitrage detection and trading advice.',
    color: 'from-success-500 to-success-600',
    link: '/live',
  },
  {
    icon: GitCompare,
    title: 'Before/After Comparison',
    description:
      'Side-by-side visualization of market vs. corrected volatility surfaces.',
    color: 'from-warning-500 to-warning-600',
    link: '/dashboard',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function HomePage() {
  const navigate = useNavigate()

  return (
    <PageLayout fullWidth noPadding>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-1.5 text-sm text-primary-400 mb-6">
              <Activity className="h-4 w-4" />
              <span>Professional Volatility Analytics</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Vol-Arb</span>
              <br />
              <span className="text-surface-100">Arbitrage Detection & Correction</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10">
              Transform your volatility surface into an arbitrage-free representation
              using advanced quadratic programming optimization.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/wizard" className="btn-primary px-6 py-3 text-lg">
                <Compass className="h-5 w-5 mr-2" />
                Start Analysis
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link to="/dashboard" className="btn-secondary px-6 py-3 text-lg">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-surface-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              Everything you need to analyze, detect, and correct volatility arbitrage
              in one professional dashboard.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="card-interactive group"
                  onClick={() => navigate(feature.link)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(feature.link) }}
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} mb-4 shadow-glow-sm group-hover:shadow-glow-md transition-shadow`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-surface-400">{feature.description}</p>
                  <div className="mt-4 flex items-center text-sm text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="glass-card p-8 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-surface-400 mb-6">
              Upload your volatility data, detect arbitrage violations, and generate
              arbitrage-free surfaces in minutes.
            </p>
            <Link to="/wizard" className="btn-primary px-6 py-3">
              Launch Wizard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  )
}
