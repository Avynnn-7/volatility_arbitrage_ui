import { useEffect, useState } from 'react'
import { useHealthCheckQuery } from '@/store/api/volArbApi'

/**
 * API connection status
 */
export type ApiStatus = 'checking' | 'connected' | 'disconnected' | 'error'

/**
 * Hook for monitoring API server status
 */
export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Poll health endpoint every 30 seconds
  const { data, error, isLoading, refetch } = useHealthCheckQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (isLoading) {
      setStatus('checking')
    } else if (error) {
      setStatus('disconnected')
    } else if (data) {
      setStatus(data.status === 'healthy' ? 'connected' : 'error')
      setLastChecked(new Date())
    }
  }, [data, error, isLoading])

  return {
    status,
    isConnected: status === 'connected',
    isLoading,
    lastChecked,
    serverVersion: data?.version,
    serverUptime: data?.uptime,
    refetch,
  }
}
