import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Mono, Display } from '../components/Typography';
import { useAuth } from '../context/AuthContext';
import {
  useMapTheme,
  MAP_THEME_ORDER,
  MAP_THEME_LABELS,
  MAP_THEME_SUB,
  MapThemeId,
} from '../context/MapThemeContext';
import { displayNameFromJwtClaims, initialsFromUser } from '../service/jwtDecode';
import { W, fonts } from '../tokens';

interface RowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub?: string;
  value?: string;
  toggle?: boolean;
  selected?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  last?: boolean;
}

function Row({ icon, iconBg, title, sub, value, toggle, selected, destructive, onPress, last }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: W.lineSoft }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: destructive ? W.coral : W.ink }}>{title}</Text>
        {sub && <Text style={{ fontFamily: fonts.body, fontSize: 11, color: W.ink3, marginTop: 2 }}>{sub}</Text>}
      </View>
      {value && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: W.ink2 }}>{value}</Text>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={W.ink4} strokeWidth={2.5}>
            <Path d="M9 18l6-6-6-6" />
          </Svg>
        </View>
      )}
      {selected && (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={W.coral} strokeWidth={2.5}>
          <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      {toggle !== undefined && (
        <View style={{ width: 36, height: 22, borderRadius: 999, backgroundColor: toggle ? W.coral : W.bg4, justifyContent: 'center' }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: toggle ? 'white' : W.ink3, position: 'absolute', left: toggle ? 16 : 2 }} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Mono style={{ paddingHorizontal: 22, marginBottom: 8 }}>{title}</Mono>
      <View style={{ marginHorizontal: 16, backgroundColor: W.bg2, borderWidth: 1, borderColor: W.lineSoft, borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

export function ScreenSettings() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { mapTheme, setMapTheme } = useMapTheme();

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  const displayName = displayNameFromJwtClaims(user);
  const userInitials = initialsFromUser(displayName, user?.email);

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0, paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16 }}>
          <Mono color={W.coral}>// SYSTEM</Mono>
          <Display size={30} style={{ marginTop: 6 }}>Configurações</Display>
        </View>

        {/* Profile card */}
        <View style={{ marginHorizontal: 16, marginBottom: 22, borderWidth: 1, borderColor: W.line, borderRadius: 18, overflow: 'hidden' }}>
          <LinearGradient
            colors={[W.bg2, W.bg3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <LinearGradient
              colors={['#8C7BFF', '#FF6B5E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: 'white' }}>{userInitials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Display size={16}>{displayName}</Display>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: W.ink3, marginTop: 4 }}>
                {user?.email ?? ''}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <Section title="Tema do mapa">
          {MAP_THEME_ORDER.map((key: MapThemeId, i) => (
            <Row
              key={key}
              iconBg="rgba(255,255,255,0.06)"
              icon={<Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.ink2} strokeWidth={2}><Circle cx={12} cy={12} r={4}/></Svg>}
              title={MAP_THEME_LABELS[key]}
              sub={MAP_THEME_SUB[key]}
              selected={mapTheme === key}
              onPress={() => setMapTheme(key)}
              last={i === MAP_THEME_ORDER.length - 1}
            />
          ))}
        </Section>

        <Section title="Conta">
          <Row
            iconBg="rgba(255,107,94,0.15)"
            icon={<Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.coral} strokeWidth={2}><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></Svg>}
            title="Sair"
            sub="Encerrar sessão"
            destructive
            onPress={handleLogout}
            last
          />
        </Section>
      </ScrollView>
    </View>
  );
}
