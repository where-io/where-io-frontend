# Map Modal Dismiss + Spring Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o modal de localização no mapa desaparecer ao tocar fora dele, com animação spring na entrada e timing na saída.

**Architecture:** Adicionar `map.on('click')` no HTML do Leaflet para postar `mapClicked` via WebView postMessage; `LeafletMap` expõe `onMapPress` prop; `ScreenMap` gerencia `displayLocation` separado de `selectedLocation` para manter conteúdo visível durante animação de saída.

**Tech Stack:** React Native `Animated`, `Easing`, react-native-webview, Leaflet (in-HTML JS)

---

### Task 1: LeafletMap — map click postMessage + onMapPress prop

**Files:**
- Modify: `mobile/src/components/LeafletMap.tsx`

- [ ] **Step 1: Adicionar `map.on('click')` no HTML do Leaflet**

  Na função `buildHtml`, localizar o bloco `/* ── Message handler ── */` e adicionar **antes** dele:

  ```javascript
  /* ── Map tap (dismiss selection) ── */
  map.on('click', function() {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapClicked' }));
    }
  });
  ```

- [ ] **Step 2: Adicionar `onMapPress` à interface Props**

  ```typescript
  interface Props {
    locations: Local[];
    mapTheme?: MapThemeId;
    selectedLocationId?: string | null;
    onLocationSelect?: (location: Local) => void;
    flyToCoords?: UserLocation | null;
    userLocation?: UserLocation | null;
    userInitials?: string;
    onMapPress?: () => void;   // ← novo
  }
  ```

- [ ] **Step 3: Desestruturar `onMapPress` na função e adicionar ao handleMessage**

  Desestruturar no parâmetro da função:
  ```typescript
  export function LeafletMap({
    locations,
    mapTheme = 'satellite',
    selectedLocationId,
    onLocationSelect,
    flyToCoords,
    userLocation,
    userInitials = 'EU',
    onMapPress,           // ← novo
  }: Props) {
  ```

  Dentro do `handleMessage` useCallback, adicionar o branch novo e `onMapPress` ao dep array:
  ```typescript
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'locationSelected' && onLocationSelect) {
        const loc = locations.find(l => l.id === msg.locationId);
        if (loc) onLocationSelect(loc);
      }
      if (msg.type === 'mapClicked') {
        onMapPress?.();
      }
    } catch {}
  }, [locations, onLocationSelect, onMapPress]);
  ```

- [ ] **Step 4: Verificar manualmente**

  O arquivo deve compilar sem erros TypeScript. Confirmar que os tipos batem antes de continuar.

- [ ] **Step 5: Commit**

  ```bash
  git add mobile/src/components/LeafletMap.tsx
  git commit -m "feat(mobile): expose onMapPress prop on LeafletMap via mapClicked postMessage"
  ```

---

### Task 2: ScreenMap — animação spring + dismiss on tap

**Files:**
- Modify: `mobile/src/screens/ScreenMap.tsx`

- [ ] **Step 1: Adicionar `Animated` e `Easing` ao import do react-native**

  ```typescript
  import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, Animated, Easing,
  } from 'react-native';
  ```

- [ ] **Step 2: Adicionar `slideAnim` ref e `displayLocation` state dentro do componente**

  Logo após as declarações de estado existentes (depois de `const [postCreateFocus, ...]`):

  ```typescript
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [displayLocation, setDisplayLocation] = useState<Local | null>(null);
  ```

- [ ] **Step 3: Adicionar useEffect de animação**

  Logo após os `useEffect` existentes (depois do que monitora `postCreateFocus`):

  ```typescript
  useEffect(() => {
    if (selectedLocation) {
      setDisplayLocation(selectedLocation);
      slideAnim.stopAnimation();
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setDisplayLocation(null);
      });
    }
  }, [selectedLocation]);
  ```

- [ ] **Step 4: Substituir o bottom sheet**

  Remover o bloco `{/* Bottom sheet — selected location */}` inteiro (linhas com `{selectedLocation && ...}`) e substituir por:

  ```tsx
  {/* Bottom sheet — selected location */}
  {displayLocation && (
    <Animated.View
      style={{
        position: 'absolute', bottom: 112, left: 16, right: 16, zIndex: 20,
        opacity: slideAnim,
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [60, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => navigation.navigate('Detail', { location: displayLocation })}
      >
        <GlassPanel style={{ borderRadius: 22, padding: 16, borderWidth: 1, borderColor: W.line }}>
          <View style={{
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: W.ink4, alignSelf: 'center', marginBottom: 12,
          }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 38, height: 38, borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1.5, borderColor: pinColorForLocal(displayLocation),
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{
                fontFamily: fonts.display, fontSize: 13,
                color: pinColorForLocal(displayLocation),
              }}>
                {displayLocation.nome.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 15, color: W.ink }}>
                {displayLocation.nome}
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 11, color: W.ink3, marginTop: 2 }}>
                {displayLocation.endereco?.logradouro ?? ''}
                {displayLocation.endereco?.cidade ? ` · ${displayLocation.endereco.cidade}` : ''}
              </Text>
            </View>
            {displayLocation.tags?.[0] && (
              <View style={{
                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: W.line,
              }}>
                <Text style={{
                  fontFamily: fonts.mono, fontSize: 9,
                  color: W.ink3, textTransform: 'uppercase', letterSpacing: 0.8,
                }}>
                  {displayLocation.tags[0].nome}
                </Text>
              </View>
            )}
          </View>
        </GlassPanel>
      </TouchableOpacity>
    </Animated.View>
  )}
  ```

- [ ] **Step 5: Passar `onMapPress` ao `LeafletMap`**

  No JSX do `<LeafletMap>`, adicionar a prop:

  ```tsx
  <LeafletMap
    locations={filteredLocations}
    mapTheme={mapTheme}
    selectedLocationId={selectedLocation?.id}
    onLocationSelect={loc => setSelectedLocation(loc)}
    flyToCoords={flyToCoords}
    userLocation={userLocation}
    userInitials={userInitials}
    onMapPress={() => setSelectedLocation(null)}
  />
  ```

- [ ] **Step 6: Verificar compilação TypeScript**

  Confirmar que não há erros de tipo antes de testar.

- [ ] **Step 7: Commit**

  ```bash
  git add mobile/src/screens/ScreenMap.tsx
  git commit -m "feat(mobile): spring animation and dismiss-on-map-tap for location modal"
  ```

---

### Verificação manual (checklist de teste)

- [ ] Tocar num pin → modal sobe com spring bounce (leve overshooting)
- [ ] Tocar no fundo do mapa → modal desliza para baixo e desaparece
- [ ] Tocar no modal → navega para Detail (não fecha)
- [ ] Trocar de pin enquanto modal está visível → modal reseta e anima novamente para o novo local
