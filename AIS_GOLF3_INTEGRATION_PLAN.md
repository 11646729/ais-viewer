# Integration Plan: AIS-Viewer → Golf-3

## Overview

AIS-Viewer adds **live real-time vessel tracking** (from the AIS Stream API) to golf-3. Note that golf-3 already has a `vesselController.js` for cruise ships scraped from CruiseMapper — this is separate and both will coexist. You're adding a new "Live AIS Vessels" feature.

---

## Step 1 — Enable PostGIS on `golf3db`

AIS-Viewer uses PostGIS spatial queries. Golf-3's database (`golf3db`) needs the extension.

Run once:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Golf-3's `databaseUtilities.js` will need to create the `aisvessels` table on startup (with the `GEOMETRY` column). You already have `NEW_DB_URI` pointing at `golf3db` in ais-viewer's `.env`, so the table may already be there.

---

## Step 2 — Copy AIS Backend Services into Golf-3

Copy these three files from `ais-viewer/server/src/services/` into `golf-3/backend/services/` (create the folder):

| Source | Destination | Purpose |
|--------|-------------|---------|
| `AISService.js` | `backend/services/AISService.js` | Connects to AIS Stream WebSocket, receives position reports |
| `messageParser.js` | `backend/services/messageParser.js` | Parses raw AIS messages, upserts into `aisvessels` table |
| `queryVessels.js` | `backend/services/queryVessels.js` | PostGIS spatial query to find nearby vessels |

Minor adaptations needed:
- Update DB import in each file to use golf-3's `DatabaseAdapter` from `databaseUtilities.js` instead of ais-viewer's `db.js`
- `messageParser.js` uses `pg` directly — align with golf-3's db pattern

---

## Step 3 — Create an AIS Controller

Create `golf-3/backend/controllers/aisController.js` with:

- **`initAISVesselsTable()`** — creates the `aisvessels` table (with PostGIS geometry column) on startup
- **`startAISService()`** — launches the AIS stream background connection (called once at server start)
- **`getAISVessels(req, res)`** — REST endpoint: accepts `latitude`, `longitude`, `radius` query params, runs the spatial query, returns JSON array of nearby vessels
- **`emitAISVesselData(socket, lat, lng, radius)`** — Socket.io emit function for real-time updates (mirrors the pattern in `rtWeatherController.js`)

---

## Step 4 — Add AIS Route Catalog

Create `golf-3/backend/routes/aisRouteCatalog.js`:

```
GET /api/ais/                    → catalog info
GET /api/ais/vessels             → nearby vessels (?latitude=&longitude=&radius=)
```

Register in `server.js` alongside the other 8 route catalogs.

---

## Step 5 — Wire AIS into Real-time Emissions

In `enableRealtimeData.js`, add an AIS vessels emission alongside weather/calendar/news. The client will send its location via a Socket.io event (replacing the current raw WebSocket `location-update` message), and the server will respond with nearby vessels on a 10-second cron.

Pattern:
```js
socket.on("ais-location-update", ({ latitude, longitude, radius }) => {
  // store per-socket location, start/update cron emission
})
```

---

## Step 6 — Add Environment Variables

Add to `golf-3/backend/.env`:

```
AIS_API_KEY=85523df8f5adc2fca3f3b23e2d872a9e553d5c96
AIS_BOUNDING_BOX_MIN_LAT=54.0
AIS_BOUNDING_BOX_MAX_LAT=55.5
AIS_BOUNDING_BOX_MIN_LON=-7.0
AIS_BOUNDING_BOX_MAX_LON=-4.5
```

---

## Step 7 — Port Frontend Components

Copy from `ais-viewer/newClient/src/components/` into `golf-3/frontend/src/components/`:

| Source | Destination | Changes needed |
|--------|-------------|----------------|
| `VesselsMap.jsx` | `frontend/src/components/AISVesselsMap.jsx` | Replace raw `WebSocket` with Socket.io `socket.on("ais-vessels", ...)` |
| `VesselsReport.jsx` | `frontend/src/components/AISVesselsReport.jsx` | Wrap in MUI `Card`/`Paper` to match golf-3 style |

Also create `frontend/src/cards/AISVesselsCard.jsx` to follow golf-3's card pattern (matching `CruiseCard.jsx`, `WeatherCard.jsx`, etc.).

---

## Step 8 — Add Function Handler

Create `golf-3/frontend/src/functionHandlers/loadAISVesselDataHandler.js` to manage Socket.io subscription setup for AIS data — mirrors the pattern of `startRealtimeDataHandler.js`.

---

## Step 9 — Add Page/Route

Add a new page `frontend/src/pages/AISVesselsPage.jsx` and register it in the React Router config. Add a nav link/card entry on the home catalog page alongside Golf Courses, Cruise Ships, etc.

---

## Summary of Files to Create/Modify

**New files in golf-3:**
- `backend/services/AISService.js`
- `backend/services/messageParser.js`
- `backend/services/queryVessels.js`
- `backend/controllers/aisController.js`
- `backend/routes/aisRouteCatalog.js`
- `frontend/src/components/AISVesselsMap.jsx`
- `frontend/src/components/AISVesselsReport.jsx`
- `frontend/src/cards/AISVesselsCard.jsx`
- `frontend/src/functionHandlers/loadAISVesselDataHandler.js`
- `frontend/src/pages/AISVesselsPage.jsx`

**Modified files in golf-3:**
- `backend/server.js` — register AIS route, call `startAISService()` and `initAISVesselsTable()` on startup
- `backend/enableRealtimeData.js` — add `ais-location-update` socket handler + cron emission
- `backend/.env` — add `AIS_API_KEY` and bounding box vars
- `frontend/src/index.jsx` (or router config) — add AIS page route

---

## Key Technical Decision

The biggest architectural change is the **WebSocket → Socket.io bridge**. AIS-Viewer's frontend uses a raw `WebSocket`; golf-3 uses Socket.io. The simplest path is to adapt the frontend components to use Socket.io (which golf-3 already has wired up), rather than running a second WebSocket server inside golf-3. This keeps everything on one real-time connection.
