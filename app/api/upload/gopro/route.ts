import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const trackId = formData.get('track_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic imports for server-only packages
    const gpmfExtract = (await import('gpmf-extract')).default
    const goProTelemetry = (await import('gopro-telemetry')).default

    const extracted = await gpmfExtract(buffer)
    const telemetry = await goProTelemetry(extracted, { stream: ['GPS5', 'GPS9'] })

    // Extract GPS points from telemetry streams
    const points: { lat: number; lng: number; speed: number; altitude: number; time: number }[] = []

    for (const deviceKey of Object.keys(telemetry)) {
      const device = (telemetry as unknown as Record<string, Record<string, unknown>>)[deviceKey]
      const streams = (device?.streams || device) as Record<string, { samples?: { value?: number[][]; date?: string; cts?: number }[] }> | undefined
      if (!streams) continue

      // Try GPS5 first (lat, lng, alt, 2d speed, 3d speed), then GPS9
      const gpsStream = streams['GPS5'] || streams['GPS9'] || streams['GPS (Lat., Long., Alt., 2D speed, 3D speed)']
      if (!gpsStream?.samples) continue

      for (const sample of gpsStream.samples) {
        if (!sample.value) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawValues = sample.value as any[]
        const values: number[][] = Array.isArray(rawValues[0]) ? rawValues : [rawValues]
        for (const v of values) {
          if (v.length >= 4) {
            const lat = Number(v[0])
            const lng = Number(v[1])
            const alt = Number(v[2])
            const speed2d = Number(v[3]) // m/s

            // Skip invalid coordinates
            if (lat === 0 && lng === 0) continue
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue

            points.push({
              lat,
              lng,
              speed: speed2d * 2.23694, // m/s to mph
              altitude: alt * 3.28084, // m to ft
              time: sample.date ? new Date(sample.date).getTime() : (sample.cts || 0),
            })
          }
        }
      }
    }

    if (points.length === 0) {
      return NextResponse.json({ error: 'No GPS data found in video. Ensure GPS was enabled on your GoPro.' }, { status: 400 })
    }

    // Calculate stats
    const speeds = points.map(p => p.speed).filter(s => s > 0)
    const topSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0

    // Calculate distance
    let totalDist = 0
    for (let i = 1; i < points.length; i++) {
      const R = 3958.8
      const dLat = (points[i].lat - points[i - 1].lat) * Math.PI / 180
      const dLng = (points[i].lng - points[i - 1].lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(points[i - 1].lat * Math.PI / 180) * Math.cos(points[i].lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
      totalDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const duration = points.length > 1 ? points[points.length - 1].time - points[0].time : 0

    // Detect laps if track has coordinates
    let lapsData = null
    if (trackId) {
      const { data: track } = await supabase.from('tracks').select('start_lat, start_lng, finish_lat, finish_lng').eq('id', trackId).single()
      if (track?.start_lat && track?.start_lng) {
        const { detectLaps } = await import('@/lib/gps-utils')
        lapsData = detectLaps(points, track.start_lat, track.start_lng, track.finish_lat, track.finish_lng)
      }
    }

    // Save session
    const { data: session, error } = await supabase.from('sessions').insert({
      user_id: user.id,
      track_id: trackId || null,
      source: 'gopro',
      gps_data: points,
      laps_data: lapsData,
      top_speed_mph: Math.round(topSpeed * 10) / 10,
      avg_speed_mph: Math.round(avgSpeed * 10) / 10,
      total_distance_miles: Math.round(totalDist * 100) / 100,
      total_duration_ms: duration,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process video'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
