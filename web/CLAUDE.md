# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Dev server at http://localhost:3000
npm test         # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once (CI-style)
npm run build    # Production build
```

## Backend Dependency

The app talks to a Spring Boot API at `http://localhost:8080`. Key endpoints:
- `GET  /api/local/all` — fetch all saved locations
- `POST /api/local` — create a location (uses `REACT_APP_API_URL` env var, falls back to the hardcoded URL)
- `GET  /api/visita/:localId` — fetch visits for a location
- `POST /api/visita` — register a visit

The backend must be running for the app to work. Map markers and forms won't function without it.

## Architecture

**Entry point:** `src/index.js` → `src/App.js` → `src/routes/AppRouter.jsx`

**Only two routes:**
- `/` → `src/pages/Home.jsx` (main app)
- `/teste` → `CollectionSidebar` (dev/test route)

**`Home.jsx` is the orchestrator** — it owns all state (locations, selected location, sidebar visibility, visits) and passes down callbacks. All API calls originate here except for form submissions, which call the API directly from `CadastroLocal` and `CadastroVisita`.

**Map interaction flow:**
1. `MapActionsProvider` (Context in `src/features/mapa/MapContext.jsx`) exposes a `flyTo` function
2. `Mapa.jsx` registers itself as the `flyTo` implementation via `setFlyTo` inside a `FlyToLocation` child component (required because `useMap()` only works inside `MapContainer`)
3. Any component that needs to pan the map calls `useMapActions().flyTo()`

**Feature structure under `src/features/`:**
- `mapa/` — Leaflet map with Esri satellite tiles; Google Maps API is loaded in `public/index.html` but used only for place search autocomplete in `CadastroLocal`
- `cadastroLocal/` — "Create Location" modal form; uses a `useGooglePlaces` custom hook to wrap the Google Places Autocomplete API; parses Brazilian address strings into structured fields before POSTing
- `cadastroVisita/` — "Register Visit" modal form with date, star rating, and comment
- `sidebar/` — Three sidebars: `SideBar` (persistent left nav), `LocationSidebar` (location detail panel), `CollectionSidebar` (saved places drawer)
- `button/`, `grid/` — Shared UI primitives

**Shared components** live in `src/components/navlink/`:
- `FormSign.jsx` — modal overlay wrapper
- `FormField.jsx` — labeled input wrapper with optional Material Symbols icon
- `NavLink.jsx` — sidebar navigation item

## Styling

Tailwind CSS (v3) + inline styles for complex backgrounds. The design uses a dark space/navigation theme with color tokens hardcoded as Tailwind arbitrary values (`bg-[#101225]`, `text-[#ffb3b1]`, etc.). The `Manrope` font and `Material Symbols Outlined` icon font are loaded from Google Fonts in `public/index.html`.

## External APIs

- **Leaflet + react-leaflet** for the map (Esri World Imagery tile layer)
- **Google Maps JavaScript API** — loaded via bootstrap snippet in `public/index.html`; used only for Places Autocomplete in `CadastroLocal`. The API key is embedded directly in the HTML file.
