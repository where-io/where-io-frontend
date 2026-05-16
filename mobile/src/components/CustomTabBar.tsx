import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { W, fonts } from '../tokens';

type TabId = 'Map' | 'Collection' | 'Friends' | 'Profile';

function MapIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} stroke={color} />
      <Path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" stroke={color} />
    </Svg>
  );
}

function CollectionIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke={color} />
    </Svg>
  );
}

function FriendsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={8} r={4} stroke={color} />
      <Path d="M2 21a7 7 0 0114 0M17 11a4 4 0 010-8M22 21a7 7 0 00-5-6.7" stroke={color} />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} stroke={color} />
      <Path d="M4 21a8 8 0 0116 0" stroke={color} />
    </Svg>
  );
}

const tabLabels: Record<TabId, string> = {
  Map: 'Mapa',
  Collection: 'Coleção',
  Friends: 'Amigos',
  Profile: 'Perfil',
};

function renderIcon(id: TabId, color: string) {
  switch (id) {
    case 'Map': return <MapIcon color={color} />;
    case 'Collection': return <CollectionIcon color={color} />;
    case 'Friends': return <FriendsIcon color={color} />;
    case 'Profile': return <ProfileIcon color={color} />;
  }
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom + 6, 20);

  const handleCTA = () => {
    (navigation as any).getParent()?.navigate('Create');
  };

  // Insert null (CTA) between index 1 and 2
  const items: (typeof state.routes[0] | null)[] = [
    state.routes[0],
    state.routes[1],
    null,
    state.routes[2],
    state.routes[3],
  ];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        paddingBottom,
        paddingTop: 14,
      }}
    >
      {/* Fade gradient background */}
      <LinearGradient
        colors={['transparent', '#0A1028']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      {/* Tab bar pill */}
      <View
        style={[
          {
            marginHorizontal: 18,
            height: 64,
            backgroundColor: 'rgba(20,27,54,0.85)',
            borderColor: W.line,
            borderWidth: 1,
            borderRadius: 22,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
          },
          Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              } as any)
            : {},
        ]}
      >
        {items.map((route, index) => {
          if (!route) {
            return (
              <View key="cta" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity onPress={handleCTA} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[W.coralSoft, W.coral]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round">
                      <Path d="M12 5v14M5 12h14" />
                    </Svg>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }

          const routeIndex = state.routes.indexOf(route);
          const focused = state.index === routeIndex;
          const routeName = route.name as TabId;
          const iconColor = focused ? W.coral : W.ink3;

          return (
            <TouchableOpacity
              key={route.key}
              style={{ flex: 1, alignItems: 'center', gap: 4 }}
              onPress={() => navigation.navigate(route.name as never)}
              activeOpacity={0.7}
            >
              {renderIcon(routeName, iconColor)}
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: fonts.mono,
                  letterSpacing: 0.9,
                  textTransform: 'uppercase',
                  color: iconColor,
                }}
              >
                {tabLabels[routeName]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
