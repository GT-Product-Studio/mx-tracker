'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GpsPoint } from '@/lib/gps-utils'
import { speedColor } from '@/lib/gps-utils'

interface SessionMapProps {
  points: GpsPoint[]
  livePoint?: GpsPoint | null
  height?: string
  interactive?: boolean
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'

export default function SessionMap({ points, livePoint, height = '500px', interactive = true }: SessionMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const liveMarkerRef = useRef<L.CircleMarker | null>(null)
  const polylineGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: L.LatLngExpression = points.length > 0
      ? [points[0].lat, points[0].lng]
      : [33.92, -117.25] // Default: SoCal

    const map = L.map(containerRef.current, {
      center,
      zoom: 15,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      attributionControl: false,
    })

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map)
    mapRef.current = map
    polylineGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw speed-colored trace
  useEffect(() => {
    if (!mapRef.current || !polylineGroupRef.current || points.length < 2) return

    polylineGroupRef.current.clearLayers()

    const maxSpeed = Math.max(...points.map(p => p.speed ?? 0), 1)

    // Draw segments colored by speed
    for (let i = 1; i < points.length; i++) {
      const color = speedColor(points[i].speed ?? 0, maxSpeed)
      L.polyline(
        [[points[i - 1].lat, points[i - 1].lng], [points[i].lat, points[i].lng]],
        { color, weight: 3, opacity: 0.9 }
      ).addTo(polylineGroupRef.current!)
    }

    // Start marker
    L.circleMarker([points[0].lat, points[0].lng], {
      radius: 6, fillColor: '#00D26A', fillOpacity: 1, color: '#fff', weight: 2,
    }).bindTooltip('Start').addTo(polylineGroupRef.current)

    // End marker
    const last = points[points.length - 1]
    L.circleMarker([last.lat, last.lng], {
      radius: 6, fillColor: '#FF4444', fillOpacity: 1, color: '#fff', weight: 2,
    }).bindTooltip('End').addTo(polylineGroupRef.current)

    // Fit bounds
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
    mapRef.current.fitBounds(bounds, { padding: [30, 30] })
  }, [points])

  // Live position marker
  useEffect(() => {
    if (!mapRef.current || !livePoint) return

    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLatLng([livePoint.lat, livePoint.lng])
    } else {
      liveMarkerRef.current = L.circleMarker([livePoint.lat, livePoint.lng], {
        radius: 8, fillColor: '#00D26A', fillOpacity: 1, color: '#fff', weight: 3,
      }).addTo(mapRef.current)
    }

    mapRef.current.panTo([livePoint.lat, livePoint.lng])
  }, [livePoint])

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="rounded-xl overflow-hidden border border-border"
    />
  )
}
