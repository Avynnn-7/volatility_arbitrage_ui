export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-surface-700/50 bg-surface-900/50 py-6">
      <div className="flex flex-col items-center justify-center gap-2 text-sm text-surface-500">
        <p>
          Vol-Arb © {currentYear} — Professional Volatility Arbitrage Analysis
        </p>
      </div>
    </footer>
  )
}
