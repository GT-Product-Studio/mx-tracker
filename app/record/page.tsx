'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'
import { haversineDistance, formatDuration, detectLaps, calculateSessionStats } from '@/lib/gps-utils'
import type { GpsPoint } from '@/lib/gps-utils'
import type { Track } from '@/lib/types'

const SessionMap = dynamic(() => import('@/components/session-map'), { ssr: false })

type RecordingState = 'idle' | 'recording' | 'saving' | 'done'

export default function RecordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [state, setState] = useState<RecordingState>('idle')
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [livePoint, setLivePoint] = useState<GpsPoint | null>(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [distance, setDistance] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState('')
  const [error, setError] = useState('')

  const watchIdRef = useRef<number | null>(null)
  const pointsRef = useRef<GpsPoint[]>([])
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const distRef = useRef(0)

  useEffect(() => {
    supabase.from('tracks').select('*').order('name').then(({ data }) => {
      if (data) setTracks(data)
    })
    return () => stopRecording()
  }, [])

  const startRecording = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setError('')
    setState('recording')
    pointsRef.current = []
    distRef.current = 0
    setPoints([])
    setDistance(0)
    setCurrentSpeed(0)
    startTimeRef.current = Date.now()

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 1000)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed !== null ? pos.coords.speed * 2.23694 : 0, // m/s to mph
          altitude: pos.coords.altitude !== null ? pos.coords.altitude * 3.28084 : undefined,
          time: pos.timestamp,
        }

        const prev = pointsRef.current[pointsRef.current.length - 1]
        if (prev) {
          distRef.current += haversineDistance(prev.lat, prev.lng, point.lat, point.lng)
          setDistance(distRef.current)
        }

        pointsRef.current.push(point)
        setPoints([...pointsRef.current])
        setLivePoint(point)
        setCurrentSpeed(point.speed ?? 0)
      },
      (err) => {
        setError(`GPS error: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    )
  }, [])

  const stopRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const saveSession = useCallback(async () => {
    stopRecording()
    setState('saving')

    const finalPoints = pointsRef.current
    if (finalPoints.length < 2) {
      setError('Not enough GPS data recorded. Try moving around more.')
      setState('idle')
      return
    }

    const stats = calculateSessionStats(finalPoints)

    // Detect laps if track selected
    let lapsData = null
    if (selectedTrack) {
      const track = tracks.find(t => t.id === selectedTrack)
      if (track?.start_lat && track?.start_lng) {
        lapsData = detectLaps(finalPoints, track.start_lat, track.start_lng, track.finish_lat ?? undefined, track.finish_lng ?? undefined)
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to save sessions')
      setState('idle')
      return
    }

    const { data: session, error: err } = await supabase.from('sessions').insert({
      user_id: user.id,
      track_id: selectedTrack || null,
      source: 'phone',
      gps_data: finalPoints,
      laps_data: lapsData,
      top_speed_mph: Math.round(stats.topSpeed * 10) / 10,
      avg_speed_mph: Math.round(stats.avgSpeed * 10) / 10,
      total_distance_miles: Math.round(stats.distance * 100) / 100,
      total_duration_ms: stats.duration,
    }).select().single()

    if (err || !session) {
      setError(err?.message || 'Failed to save session')
      setState('idle')
      return
    }

    router.push(`/sessions/${session.id}`)
  }, [selectedTrack, tracks, router, stopRecording])

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Map fills background */}
      <div className="absolute inset-0 top-0">
        <SessionMap
          points={points}
          livePoint={livePoint}
          height="100%"
          interactive={state === 'idle'}
        />
      </div>

      {/* Overlay UI */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-between p-4">
        {/* Top stats bar */}
        {state === 'recording' && (
          <div className="flex items-center justify-center gap-6 rounded-xl bg-bg/80 backdrop-blur-md border border-border px-6 py-3">
            <div className="text-center">
              <p className="text-xs text-text-muted">Speed</p>
              <p className="font-mono text-2xl font-bold">{currentSpeed.toFixed(1)} <span className="text-sm text-text-muted">mph</span></p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-text-muted">Time</p>
              <p className="font-mono text-2xl font-bold">{formatDuration(elapsed)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-text-muted">Distance</p>
              <p className="font-mono text-2xl font-bold">{distance.toFixed(2)} <span className="text-sm text-text-muted">mi</span></p>
            </div>
          </div>
        )}

        {state === 'idle' && <div />}

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-4">
          {error && (
            <div className="w-full max-w-md rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger backdrop-blur-md">
              {error}
            </div>
          )}

          {state === 'idle' && (
            <>
              <div className="w-full max-w-md">
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="w-full bg-bg/80 backdrop-blur-md"
                >
                  <option value="">Select track (optional)</option>
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name} — {track.location_city}, {track.location_state}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={startRecording}
                className="h-20 w-20 rounded-full bg-accent text-black font-heading text-lg font-bold shadow-lg shadow-accent/20 transition-transform hover:scale-105 active:scale-95"
              >
                START
              </button>
              <p className="text-sm text-text-muted">Tap to begin recording your ride</p>
            </>
          )}

          {state === 'recording' && (
            <button
              onClick={saveSession}
              className="h-20 w-20 rounded-full bg-danger text-white font-heading text-lg font-bold shadow-lg shadow-danger/20 transition-transform hover:scale-105 active:scale-95"
            >
              STOP
            </button>
          )}

          {state === 'saving' && (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-bg/80 backdrop-blur-md border border-border p-6">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
              <p className="text-sm text-text-muted">Saving session...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
