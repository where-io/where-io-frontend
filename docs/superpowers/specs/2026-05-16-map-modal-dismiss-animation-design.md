# Design: Map Modal Dismiss on Tap + Spring Animation

**Date:** 2026-05-16  
**Scope:** `mobile/src/components/LeafletMap.tsx`, `mobile/src/screens/ScreenMap.tsx`

## Goal

When a location pin is tapped on the map screen, a bottom-sheet modal appears. The user wants:
1. Tapping anywhere else on the map dismisses the modal.
2. The modal animates in (spring slide-up + fade) and out (timing slide-down + fade).

## Approach: Map click via postMessage (Option A)

Chosen because it is the most natural UX — the user directly taps the map — and reuses the existing WebView ↔ React Native message channel.

## Changes

### LeafletMap.tsx

- Add `map.on('click', fn)` in the HTML template, after marker setup.  
  The handler posts `{ type: 'mapClicked' }` via `ReactNativeWebView.postMessage`.  
  Leaflet marker click does **not** bubble to the map, so pin taps are unaffected.
- Add optional prop `onMapPress?: () => void` to the `Props` interface.
- In `handleMessage` (inside `useCallback`), handle `msg.type === 'mapClicked'` → call `onMapPress?.()`.
- Add `onMapPress` to the `useCallback` dependency array of `handleMessage`.

### ScreenMap.tsx

- Import `Animated` and `Easing` from `react-native`.
- Add `slideAnim = useRef(new Animated.Value(0)).current`.
- Add `displayLocation` state (`Local | null`, init `null`).  
  This state holds the content to render and is cleared **after** exit animation finishes, so the content stays visible during the slide-out.
- Add `useEffect` keyed on `selectedLocation`:
  - **On set (non-null):** update `displayLocation` immediately, reset `slideAnim` to 0, start `Animated.spring` → 1 (tension 70, friction 11, `useNativeDriver: true`).
  - **On clear (null):** start `Animated.timing` → 0 (220 ms, `Easing.in(Easing.quad)`, `useNativeDriver: true`); in the completion callback set `displayLocation(null)` only when `finished === true`.
- Replace bottom-sheet JSX:
  - Condition changes from `selectedLocation &&` to `displayLocation &&`.
  - Outer element changes from `TouchableOpacity` with absolute positioning to `Animated.View` with the same absolute positioning plus `opacity: slideAnim` and `transform: [{ translateY: slideAnim.interpolate({ inputRange:[0,1], outputRange:[60,0] }) }]`.
  - The `TouchableOpacity` (navigate to Detail) moves inside the `Animated.View`, receiving no layout styles.
- Pass `onMapPress={() => setSelectedLocation(null)}` to `<LeafletMap>`.

## Non-goals

- No changes to any other screen.
- No change to the Detail navigation flow.
- No server-side changes.

## Verification

- Tapping a pin → modal slides up with spring bounce.
- Tapping the map background → modal slides down and disappears.
- Tapping the modal itself → navigates to Detail (no dismiss).
- Selecting a different pin while modal is visible → modal resets and re-animates for new location.
