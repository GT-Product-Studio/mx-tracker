import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { DOMParser } from '@xmldom/xmldom'

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

    const xmlString = await file.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')
    const trkpts = doc.getElementsByTagName('trkpt')

    const points: { lat: number; lng: number; speed: number; altitude: number; time: number }[] = []

    for (let i = 0; i < trkpts.length; i++) {
      const trkpt = trkpts[i]
      const lat = parseFloat(trkpt.getAttribute('lat') || '0')
      const lng = parseFloat(trkpt.getAttribute('lon') || '0')

      if (lat === 0 && lng === 0) continue

      let altitude = 0
      let time = 0
      let speed = 0

      const children = trkpt.childNodes
      for (let j = 0; j < children.length; j++) {
        const child = children[j]
        if (child.nodeName === 'ele' && child.textContent) {
          altitude = parseFloat(child.textContent) * 3.28084
        }
        if (child.nodeName === 'time' && child.textContent) {
          time = new Date(child.textContent).getTime()
        }
        if (child.nodeName === 'speed' && child.textContent) {
          speed = parseFloat(child.textContent) * 2.23694
        }
      }

      points.push({ lat, lng, speed, altitude, time })
    }

    if (points.length === 0) {
      return NextResponse.json({ error: 'No trackpoints found in GPX file' }, { status: 400 })
    }

    // Calculate speeds from distance/time if not in GPX
    if (points.every(p => p.speed === 0)) {
      for (let i = 1; i < points.length; i++) {
        if (points[i].time && points[i - 1].time) {
          const dt = (points[i].time - points[i - 1].time) / 1000
          if (dt > 0) {
            const R = 3958.8
            const dLat = (points[i].lat - points[i - 1].lat) * Math.PI / 180
            const dLng = (points[i].lng - points[i - 1].lng) * Math.PI / 180
            const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(points[i - 1].lat * Math.PI / 180) * Math.cos(points[i].lat * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            points[i].speed = (dist / dt) * 3600
          }
        }
      }
      if (points.length > 1) points[0].speed = points[1].speed
    }

    // Stats
    const speeds = points.map(p => p.speed).filter(s => s > 0)
    const topSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0

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

    const duration = points.length > 1 && points[0].time && points[points.length - 1].time
      ? points[points.length - 1].time - points[0].time
      : 0

    // Detect laps
    let lapsData = null
    if (trackId) {
      const { data: track } = await supabase.from('tracks').select('start_lat, start_lng, finish_lat, finish_lng').eq('id', trackId).single()
      if (track?.start_lat && track?.start_lng) {
        const { detectLaps } = await import('@/lib/gps-utils')
        lapsData = detectLaps(points, track.start_lat, track.start_lng, track.finish_lat, track.finish_lng)
      }
    }

    const { data: session, error } = await supabase.from('sessions').insert({
      user_id: user.id,
      track_id: trackId || null,
      source: 'gpx',
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
    const message = err instanceof Error ? err.message : 'Failed to process GPX file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
