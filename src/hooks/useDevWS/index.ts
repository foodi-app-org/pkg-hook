'use client'
import { useEffect, useRef, useState } from 'react'

export const useDevWS = () => {
    const [status, setStatus] = useState("loading")
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        let reconnectTimer: any

        const connect = async () => {
            try {
                const r = await fetch('/api/ws-port')
                const { port } = await r.json()

                if (!port) {
                    setStatus("down")
                    reconnectTimer = setTimeout(connect, 2000)
                    return
                }

                const ws = new WebSocket(`ws://localhost:${port}`)
                wsRef.current = ws

                ws.onopen = () => {
                    setStatus("up")
                }

                ws.onerror = () => {
                    setStatus("down")
                    ws.close()
                }

                ws.onclose = () => {
                    setStatus("down")
                    reconnectTimer = setTimeout(connect, 2000)
                }
            } catch {
                setStatus("down")
                reconnectTimer = setTimeout(connect, 2000)
            }
        }

        connect()

        return () => {
            wsRef.current?.close()
            clearTimeout(reconnectTimer)
        }
    }, [])

    return status
}
