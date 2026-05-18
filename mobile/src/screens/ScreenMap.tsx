import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import Svg, { Circle, Path } from 'react-native-svg';
import { LeafletMap } from '../components/LeafletMap';
import { useMapTheme } from '../context/MapThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLocationSharing } from '../context/LocationSharingContext';
import { GlassPanel } from '../components/GlassPanel';
import { Mono } from '../components/Typography';
import { W, fonts } from '../tokens';
import { getAll, Local, Tag } from '../service/LocaisService';
import { getAll as getAllTags } from '../service/TagService';
import {
  displayNameFromJwtClaims,
  initialsFromUser,
} from '../service/jwtDecode';

type RootParamList = { Detail: { location: Local }; Create: undefined };
type MapTabRouteProp = RouteProp<
  { Map: { focusNewLocal?: { id: string; lat: number; lng: number } } },
  'Map'
>;

function pinColorForLocal(loc: Local): string {
  if (loc.tags?.length === 1) {
    const c = loc.tags[0].cor;
    return c.startsWith('#') ? c : '#' + c;
  }
  return W.coral;
}

export function ScreenMap() {
  const { mapTheme } = useMapTheme();
  const { user } = useAuth();
  const { sendLocation, friendLocations } = useLocationSharing();

  // Ref so GPS watch closure sees latest sendLocation without restarting the watch
  const sendLocationRef = useRef(sendLocation);
  sendLocationRef.current = sendLocation;

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<MapTabRouteProp>();

  // ── Data ──────────────────────────────────────────────────
  const [locations, setLocations] = useState<Local[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Local | null>(null);
  const [loading, setLoading] = useState(true);
  const [postCreateFocus, setPostCreateFocus] = useState<{
    id: string; lat: number; lng: number;
  } | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [displayLocation, setDisplayLocation] = useState<Local | null>(null);
  const [centerOnUserCount, setCenterOnUserCount] = useState(0);
  const handleMapPress = useCallback(() => setSelectedLocation(null), []);

  // ── User location ─────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Derive user initials from auth context
  const displayName = displayNameFromJwtClaims(user);
  const userInitials = initialsFromUser(displayName, user?.email);

  // Start watching user's position on mount, stop on unmount
  useEffect(() => {
    let active = true;

    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || !active) return;

      // 1. Posição em cache do sistema — retorna em milissegundos.
      //    Aceita posições de até 5 min e precisão até 300 m (apenas para centering inicial).
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 300,
      }).catch(() => null);

      if (lastKnown && active) {
        setUserLocation({
          lat: lastKnown.coords.latitude,
          lng: lastKnown.coords.longitude,
        });
      }

      // 2. Monitoramento contínuo — a primeira callback já traz uma fix fresca
      //    e corrige qualquer imprecisão da posição em cache.
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          timeInterval: 5000,
        },
        (loc) => {
          if (!active) return;
          setUserLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
          // Send to all friends — targetFriendIds empty means "broadcast to everyone"
          sendLocationRef.current({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            movement: 'WALKING',
            targetFriendIds: [],
          });
        },
      );
    })();

    return () => {
      active = false;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, []);

  // ── API data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const [locs, tags] = await Promise.all([getAll(), getAllTags()]);
    setLocations(locs);
    setAllTags(tags);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const p = route.params?.focusNewLocal;
      if (p?.id) {
        setPostCreateFocus(p);
        setActiveTagId(null);
        navigation.setParams({ focusNewLocal: undefined } as never);
      }
      fetchData();
    }, [fetchData, navigation, route.params]),
  );

  useEffect(() => {
    if (!postCreateFocus || loading) return;
    const loc = locations.find(l => l.id === postCreateFocus.id);
    if (loc) {
      setSelectedLocation(loc);
      setPostCreateFocus(null);
    }
  }, [locations, loading, postCreateFocus]);

  useEffect(() => () => { slideAnim.stopAnimation(); }, []);

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

  // ── Derived ───────────────────────────────────────────────
  const filteredLocations = activeTagId
    ? locations.filter(l => l.tags?.some(t => t.id === activeTagId))
    : locations;

  const flyToCoords = postCreateFocus
    ? { lat: postCreateFocus.lat, lng: postCreateFocus.lng }
    : null;

  const headerTop = insets.top + 8;
  const pinColor = displayLocation ? pinColorForLocal(displayLocation) : W.coral;

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {loading ? (
        <View style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: W.bg0, alignItems: 'center', justifyContent: 'center' },
        ]}>
          <ActivityIndicator color={W.coral} />
        </View>
      ) : (
        <LeafletMap
          locations={filteredLocations}
          mapTheme={mapTheme}
          selectedLocationId={selectedLocation?.id}
          onLocationSelect={loc => setSelectedLocation(loc)}
          flyToCoords={flyToCoords}
          userLocation={userLocation}
          userInitials={userInitials}
          centerOnUserTrigger={centerOnUserCount}
          onMapPress={handleMapPress}
          friendLocations={friendLocations}
        />
      )}

      {/* Top header */}
      <View style={{ position: 'absolute', top: headerTop, left: 16, right: 16, zIndex: 30, gap: 10 }}>
        <GlassPanel style={{
          borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          borderWidth: 1, borderColor: W.line,
        }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: W.ink }}>
            WHERE<Text style={{ color: W.coral }}>·io</Text>
          </Text>
          <View style={{ flex: 1 }} />

          {/* GPS indicator */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: userLocation
              ? 'rgba(94,224,200,0.12)'
              : 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: userLocation
              ? 'rgba(94,224,200,0.25)'
              : W.line,
          }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: userLocation ? W.aqua : W.ink4,
            }} />
            <Mono
              color={userLocation ? W.aqua : W.ink4}
              size={9}
            >
              {userLocation ? 'GPS ativo' : `${locations.length} locais`}
            </Mono>
          </View>

          {/* Center on user */}
          <TouchableOpacity
            onPress={userLocation ? () => setCenterOnUserCount(c => c + 1) : undefined}
            activeOpacity={userLocation ? 0.7 : 1}
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: W.bg3, borderWidth: 1, borderColor: W.line,
              alignItems: 'center', justifyContent: 'center',
              opacity: userLocation ? 1 : 0.3,
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="8" stroke={W.ink2} strokeWidth={1.5} />
              <Circle cx="12" cy="12" r="2.5" fill={W.ink2} />
            </Svg>
          </TouchableOpacity>
        </GlassPanel>

        {/* Tag filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', gap: 6 }}
        >
          <TouchableOpacity
            onPress={() => setActiveTagId(null)}
            style={{
              paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
              backgroundColor: !activeTagId ? 'rgba(255,107,94,0.15)' : 'rgba(20,27,54,0.7)',
              borderWidth: 1, borderColor: !activeTagId ? W.coral : W.line,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
            activeOpacity={0.8}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: W.coral }} />
            <Text style={{ fontSize: 11, color: !activeTagId ? W.coral : W.ink2, fontFamily: fonts.body }}>
              Todos · {locations.length}
            </Text>
          </TouchableOpacity>

          {allTags.map(tag => {
            const active = activeTagId === tag.id;
            const color = tag.cor.startsWith('#') ? tag.cor : '#' + tag.cor;
            return (
              <TouchableOpacity
                key={tag.id}
                onPress={() => setActiveTagId(active ? null : tag.id)}
                style={{
                  paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
                  backgroundColor: active ? 'rgba(255,107,94,0.15)' : 'rgba(20,27,54,0.7)',
                  borderWidth: 1, borderColor: active ? W.coral : W.line,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
                activeOpacity={0.8}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                <Text style={{ fontSize: 11, color: active ? W.coral : W.ink2, fontFamily: fonts.body }}>
                  {tag.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: pinColor + '38',
                  borderWidth: 2, borderColor: pinColor,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    fontFamily: fonts.displayBold, fontSize: 14,
                    color: '#fff', letterSpacing: 0.5,
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
                    {displayLocation.endereco?.cidade
                      ? ` · ${displayLocation.endereco.cidade}`
                      : ''}
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
    </View>
  );
}
