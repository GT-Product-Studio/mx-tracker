export interface GpsPoint {
  lat: number
  lng: number
  speed?: number // mph
  altitude?: number // feet
  time?: number // unix ms
}

export interface LapData {
  lapNumber: number
  startIndex: number
  endIndex: number
  time_ms: number
  topSpeed: number
  avgSpeed: number
}

// Haversine distance in miles
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Convert m/s to mph
export function msToMph(ms: number): number {
  return ms * 2.23694
}

// Convert km/h to mph
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371
}

// Calculate total distance from GPS points
export function totalDistance(points: GpsPoint[]): number {
  let dist = 0
  for (let i = 1; i < points.length; i++) {
    dist += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    )
  }
  return dist
}

// Get speed color on gradient: red (slow) → gold (medium) → green (fast)
export function speedColor(speed: number, maxSpeed: number): string {
  if (maxSpeed === 0) return '#FFD700'
  const ratio = Math.min(speed / maxSpeed, 1)
  if (ratio < 0.5) {
    // Red to Gold
    const t = ratio * 2
    const r = Math.round(255)
    const g = Math.round(68 + (215 - 68) * t)
    const b = Math.round(68 - 68 * t)
    return `rgb(${r},${g},${b})`
  } else {
    // Gold to Green
    const t = (ratio - 0.5) * 2
    const r = Math.round(255 - 255 * t)
    const g = Math.round(215 + (210 - 215) * t)
    const b = Math.round(0 + 106 * t)
    return `rgb(${r},${g},${b})`
  }
}

// Detect laps by checking proximity to start/finish coordinates
const GEOFENCE_RADIUS_MILES = 0.01 // ~53 feet

export function detectLaps(
  points: GpsPoint[],
  startLat: number,
  startLng: number,
  finishLat?: number,
  finishLng?: number
): LapData[] {
  const fLat = finishLat ?? startLat
  const fLng = finishLng ?? startLng

  // Find all crossings of the finish line
  const crossings: number[] = []
  let wasNear = false

  for (let i = 0; i < points.length; i++) {
    const dist = haversineDistance(points[i].lat, points[i].lng, fLat, fLng)
    const isNear = dist < GEOFENCE_RADIUS_MILES

    if (isNear && !wasNear) {
      crossings.push(i)
    }
    wasNear = isNear
  }

  // Need at least 2 crossings for 1 lap
  if (crossings.length < 2) return []

  const laps: LapData[] = []
  for (let i = 0; i < crossings.length - 1; i++) {
    const startIdx = crossings[i]
    const endIdx = crossings[i + 1]
    const lapPoints = points.slice(startIdx, endIdx + 1)

    if (!lapPoints[0].time || !lapPoints[lapPoints.length - 1].time) continue

    const time_ms = lapPoints[lapPoints.length - 1].time! - lapPoints[0].time!
    if (time_ms < 10000) continue // Skip laps under 10 seconds (false triggers)

    const speeds = lapPoints.map(p => p.speed ?? 0)
    const topSpeed = Math.max(...speeds)
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length

    laps.push({
      lapNumber: i + 1,
      startIndex: startIdx,
      endIndex: endIdx,
      time_ms,
      topSpeed,
      avgSpeed,
    })
  }

  return laps
}

// Calculate session stats from GPS points
export function calculateSessionStats(points: GpsPoint[]) {
  const speeds = points.map(p => p.speed ?? 0).filter(s => s > 0)
  const topSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
  const distance = totalDistance(points)

  let duration = 0
  if (points.length > 1 && points[0].time && points[points.length - 1].time) {
    duration = points[points.length - 1].time! - points[0].time!
  }

  return {
    topSpeed,
    avgSpeed,
    distance,
    duration,
  }
}

// Parse GPX XML to GpsPoint array
export function parseGpx(xmlString: string): GpsPoint[] {
  const points: GpsPoint[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  const trkpts = doc.querySelectorAll('trkpt')

  trkpts.forEach((trkpt) => {
    const lat = parseFloat(trkpt.getAttribute('lat') || '0')
    const lng = parseFloat(trkpt.getAttribute('lon') || '0')
    const eleEl = trkpt.querySelector('ele')
    const timeEl = trkpt.querySelector('time')
    const speedEl = trkpt.querySelector('speed')

    const point: GpsPoint = { lat, lng }

    if (eleEl?.textContent) {
      point.altitude = parseFloat(eleEl.textContent) * 3.28084 // meters to feet
    }
    if (timeEl?.textContent) {
      point.time = new Date(timeEl.textContent).getTime()
    }
    if (speedEl?.textContent) {
      point.speed = msToMph(parseFloat(speedEl.textContent))
    }

    points.push(point)
  })

  // Calculate speeds from distance/time if not present
  if (points.length > 1 && !points[0].speed) {
    for (let i = 1; i < points.length; i++) {
      if (points[i].time && points[i - 1].time) {
        const dt = (points[i].time! - points[i - 1].time!) / 1000 // seconds
        if (dt > 0) {
          const dist = haversineDistance(
            points[i - 1].lat, points[i - 1].lng,
            points[i].lat, points[i].lng
          )
          points[i].speed = (dist / dt) * 3600 // miles per hour
        }
      }
    }
    if (points[0].time && points[1].time) {
      points[0].speed = points[1].speed
    }
  }

  return points
}

// Format duration from ms to "mm:ss" or "hh:mm:ss"
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
