/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Globals for describe, it, expect without imports
    globals: true,
    
    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/vite-env.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    
    // Reporter configuration
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry flaky tests
    retry: 0,
    
    // Watch mode configuration
    watch: false,
    
    // CSS handling
    css: true,
    
    // Mock behavior
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // Sequence
    sequence: {
      shuffle: false,
    },
    
    // Pool options
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
})
