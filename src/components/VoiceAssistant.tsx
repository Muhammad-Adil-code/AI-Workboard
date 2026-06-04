'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, X } from 'lucide-react'

type Phase = 'idle' | 'listening' | 'processing' | 'speaking'

interface Props {
  onBoardChange?: () => void
}

export default function VoiceAssistant({ onBoardChange }: Props) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [statusText, setStatusText] = useState('Tap to speak')
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const hourlyRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listeningAfterSpeak = useRef(false)

  // Init speech engines
  useEffect(() => {
    if (typeof window === 'undefined') return
    synthRef.current = window.speechSynthesis
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      handleCommand(transcript)
    }
    rec.onend = () => {
      if (listeningAfterSpeak.current) return
      setPhase(p => p === 'listening' ? 'idle' : p)
      setStatusText('Tap to speak')
    }
    rec.onerror = () => { setPhase('idle'); setStatusText('Tap to speak') }
    recognitionRef.current = rec
  }, [])

  const stopAll = useCallback(() => {
    synthRef.current?.cancel()
    try { recognitionRef.current?.stop() } catch {}
    listeningAfterSpeak.current = false
  }, [])

  const startListening = useCallback(() => {
    stopAll()
    setPhase('listening')
    setStatusText('Listening...')
    setTimeout(() => {
      try { recognitionRef.current?.start() } catch {}
    }, 100)
  }, [stopAll])

  const speak = useCallback((text: string, thenListen = true) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.05
    utter.pitch = 1.0
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en-US'))
    if (preferred) utter.voice = preferred

    utter.onstart = () => { setPhase('speaking'); setStatusText('Speaking...') }
    utter.onend = () => {
      if (thenListen) {
        listeningAfterSpeak.current = true
        setStatusText('Listening...')
        setPhase('listening')
        setTimeout(() => {
          listeningAfterSpeak.current = false
          try { recognitionRef.current?.start() } catch {}
        }, 300)
      } else {
        setPhase('idle')
        setStatusText('Tap to speak')
      }
    }
    synthRef.current.speak(utter)
  }, [])

  const handleCommand = useCallback(async (command: string) => {
    stopAll()
    setPhase('processing')
    setStatusText('Thinking...')
    try {
      const res = await fetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })
      const data = await res.json()
      if (data.action) onBoardChange?.()
      speak(data.reply || "I'm here to help.")
    } catch {
      speak("Sorry, something went wrong.")
    }
  }, [speak, stopAll, onBoardChange])

  // Open handler — greet immediately then listen
  const handleOpen = useCallback(() => {
    setOpen(true)
    setPhase('processing')
    setStatusText('Starting...')
    setTimeout(async () => {
      try {
        const res = await fetch('/api/voice-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'hey' }),
        })
        const data = await res.json()
        speak(data.reply || "Hey! I'm your WorkBoard assistant. How can I help?")
      } catch {
        speak("Hey! I'm your WorkBoard assistant. How can I help?")
      }
    }, 400)
  }, [speak])

  // Hourly update
  useEffect(() => {
    if (!open) return
    hourlyRef.current = setInterval(() => {
      handleCommand('board summary')
    }, 60 * 60 * 1000)
    return () => { if (hourlyRef.current) clearInterval(hourlyRef.current) }
  }, [open, handleCommand])

  const handleClose = useCallback(() => {
    stopAll()
    setOpen(false)
    setPhase('idle')
    setStatusText('Tap to speak')
  }, [stopAll])

  const handleMicClick = useCallback(() => {
    if (phase === 'speaking') {
      // Interrupt AI and listen
      stopAll()
      startListening()
    } else if (phase === 'listening') {
      stopAll()
      setPhase('idle')
      setStatusText('Tap to speak')
    } else if (phase === 'idle') {
      startListening()
    }
  }, [phase, stopAll, startListening])

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-all"
      >
        <Mic size={14} /> Voice AI
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #2d1b69 0%, #0f0a1e 70%)' }}>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
      >
        <X size={18} />
      </button>

      {/* Center content */}
      <div className="flex flex-col items-center gap-10">

        {/* Animation area */}
        <div className="relative flex items-center justify-center w-48 h-48">

          {/* LISTENING — expanding pulse rings */}
          {phase === 'listening' && (
            <>
              <span className="absolute w-48 h-48 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '1.2s' }} />
              <span className="absolute w-36 h-36 rounded-full bg-violet-500/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
              <span className="absolute w-24 h-24 rounded-full bg-violet-400/40 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
            </>
          )}

          {/* SPEAKING — waveform bars */}
          {phase === 'speaking' && (
            <div className="absolute flex items-center gap-1.5" style={{ bottom: '-48px' }}>
              {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6, 1.0, 0.7, 0.4].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-violet-400"
                  style={{
                    height: `${h * 40}px`,
                    animation: `wavebar 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* PROCESSING — spin ring */}
          {phase === 'processing' && (
            <span className="absolute w-44 h-44 rounded-full border-4 border-violet-500/30 border-t-violet-400 animate-spin" />
          )}

          {/* Mic button — main circle */}
          <button
            onClick={handleMicClick}
            disabled={phase === 'processing'}
            className="relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all disabled:opacity-60"
            style={{
              background: phase === 'listening'
                ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                : phase === 'speaking'
                  ? 'linear-gradient(135deg, #059669, #10b981)'
                  : phase === 'processing'
                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                    : 'linear-gradient(135deg, #4c1d95, #6d28d9)',
              boxShadow: phase === 'listening'
                ? '0 0 40px rgba(139, 92, 246, 0.6)'
                : phase === 'speaking'
                  ? '0 0 40px rgba(16, 185, 129, 0.6)'
                  : '0 0 24px rgba(109, 40, 217, 0.4)',
            }}
          >
            <Mic size={44} className="text-white" />
          </button>
        </div>

        {/* Status text */}
        <div className="text-center mt-8">
          <p className="text-white text-xl font-semibold tracking-wide">{statusText}</p>
          <p className="text-violet-300/60 text-sm mt-2">
            {phase === 'speaking' ? 'Tap mic to interrupt' :
             phase === 'listening' ? 'Speak now...' :
             phase === 'processing' ? 'Processing your request...' :
             'Tap the mic and speak'}
          </p>
        </div>
      </div>

      {/* CSS for wave bar animation */}
      <style>{`
        @keyframes wavebar {
          from { transform: scaleY(0.3); opacity: 0.7; }
          to   { transform: scaleY(1.0); opacity: 1.0; }
        }
      `}</style>
    </div>
  )
}
