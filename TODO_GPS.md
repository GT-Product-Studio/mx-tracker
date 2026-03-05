# GPS FEATURES — BUILD NEXT

After finishing current work, add these two features.

## 1. GoPro Telemetry Extraction

Install: `npm install gpmf-extract gopro-telemetry`

Build `/api/upload/gopro` route:
- Accept .mp4 file upload
- Extract GPS telemetry using gpmf-extract + gopro-telemetry
- Return: lat/lng track, speed data, timestamps
- Auto-calculate: lap times (geofenced start/finish), top speed, total distance
- Store GPS trace as GeoJSON in `sessions` table (id, user_id, track_id, gps_data jsonb, top_speed_mph, total_distance_miles, recorded_at)
- Auto-create lap entries from detected laps

Build `/sessions/[id]` page:
- Show GPS trace on map (Leaflet + OpenStreetMap)
- Color-code line by speed (green=fast, red=slow)
- Show lap splits, top speed, session stats

Install: `npm install leaflet react-leaflet @types/leaflet`

Build `/upload` page with drag-and-drop .mp4 upload UI.

## 2. PWA Phone GPS Recording

Build `/record` page:
- Use `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`
- Live map showing rider position in real-time
- Start/Stop recording buttons
- Record position every 1-2 seconds
- On stop: calculate laps (geofenced), save session to Supabase
- Show session summary with map trace

Add to tracks table: `start_lat`, `start_lng`, `finish_lat`, `finish_lng` for geofencing.

## Design
- Same dark theme (#0A0A0A bg, #00D26A accent)
- Map tiles: CartoDB dark_matter (free)
- Speed gradient: #FF4444 (slow) → #FFD700 (medium) → #00D26A (fast)
- Upload: large drag-and-drop zone with dashed border
- Record: big Start/Stop button, live stats overlay on map

Commit separately. Push to main.
