import { useCallback } from 'react'
import axios from 'axios'
import { useVanguardStore } from '../store/useVanguardStore'
import type { ScanReport } from '../store/useVanguardStore'

export function useScan() {
  const {
    setFindings,
    setScanStatus,
    setOverallScore,
    setLastScan,
    setScanHistory,
  } = useVanguardStore()

  const triggerScan = useCallback(async () => {
    setScanStatus('running')
    try {
      const { data } = await axios.post<ScanReport>('/api/v1/scan')
      setFindings(data.findings)
      setOverallScore(data.overall_score)
      setLastScan(data.scan_id, data.mode as 'mock' | 'live', data.duration_seconds)
      setScanStatus('done')
      return data
    } catch (err) {
      setScanStatus('failed')
      throw err
    }
  }, [setFindings, setScanStatus, setOverallScore, setLastScan])

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/v1/scan/history?limit=20')
      setScanHistory(data)
    } catch {
      // silently fail — history is non-critical
    }
  }, [setScanHistory])

  const fetchScanById = useCallback(async (scanId: string) => {
    const { data } = await axios.get<ScanReport>(`/api/v1/scan/${scanId}`)
    return data
  }, [])

  return { triggerScan, fetchHistory, fetchScanById }
}
