'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket(boardId: string, handlers: Record<string, (data: any) => void>) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')
    socketRef.current = socket
    socket.emit('join-board', boardId)

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    return () => {
      socket.disconnect()
    }
  }, [boardId])

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, { ...data, boardId })
  }

  return { emit }
}
