import { Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import { Suspense, lazy } from 'react'
import { store } from '@/store/store'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Navbar, Footer } from '@/components/layout'
import { Spinner } from '@/components/common/Spinner'
import { HomePage } from '@/features/home/HomePage'
import { WizardPage } from '@/features/wizard/WizardPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AnalysisPage } from '@/features/analysis/AnalysisPage'

// Lazy load heavy components for better initial load
const LiveScannerPage = lazy(() => 
  import('@/features/live/LiveScannerPage').then(m => ({ default: m.LiveScannerPage }))
)
const SurfaceViewerPage = lazy(() => 
  import('@/features/surface-viewer/SurfaceViewerPage').then(m => ({ default: m.SurfaceViewerPage }))
)
const LocalVolPage = lazy(() => 
  import('@/features/analysis/LocalVolPage').then(m => ({ default: m.LocalVolPage }))
)

// Loading fallback
function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

function AppContent() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-900">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc',
          },
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <div className="flex flex-1">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/wizard" element={<WizardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/analysis/*" element={<AnalysisPage />} />
              {/* Live Scanner - lazy loaded */}
              <Route
                path="/live"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LiveScannerPage />
                  </Suspense>
                }
              />
              {/* 3D Surface Viewer - lazy loaded */}
              <Route
                path="/surface"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SurfaceViewerPage />
                  </Suspense>
                }
              />
              {/* Local Volatility Analysis - lazy loaded */}
              <Route
                path="/localvol"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LocalVolPage />
                  </Suspense>
                }
              />
              {/* Catch-all route */}
              <Route
                path="*"
                element={
                  <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-surface-100 mb-2">404</h1>
                      <p className="text-surface-400">Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
