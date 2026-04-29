import { useEffect, useRef, useCallback } from 'react'
import { useVanguardStore } from '../store/useVanguardStore'
import type { ThreatEvent } from '../store/useVanguardStore'

// Derive WS URL from current host so this works in dev (Vite proxy),
// Docker (nginx proxy), or any other deployment without code changes.
const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/v1/threats/stream`
}
const RECONNECT_DELAY_MS = 3000

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addThreatEvent, setWsConnected } = useVanguardStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as ThreatEvent
        addThreatEvent(event)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
      // Auto-reconnect
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [addThreatEvent, setWsConnected])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    wsRef.current?.close()
    setWsConnected(false)
  }, [setWsConnected])

  return { disconnect }
}
