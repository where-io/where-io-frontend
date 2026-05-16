import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Switch,
  Animated, LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { W, fonts } from '../tokens';

type Tab = 'login' | 'register';
type PermStatus = 'idle' | 'granted' | 'denied';

// ─── Permissions step ────────────────────────────────────────

interface PermissionCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  status: PermStatus;
  onRequest: () => void;
}

function PermissionCard({ icon, iconColor, title, description, status, onRequest }: PermissionCardProps) {
  const granted = status === 'granted';
  const denied = status === 'denied';

  return (
    <View style={{
      backgroundColor: W.bg2,
      borderWidth: 1,
      borderColor: granted ? iconColor + '44' : W.line,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    }}>
      {/* Icon */}
      <View style={{
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: iconColor + '18',
        borderWidth: 1,
        borderColor: iconColor + '33',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: W.ink }}>{title}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.ink3, marginTop: 3, lineHeight: 17 }}>
          {description}
        </Text>
      </View>

      {/* Action */}
      {granted ? (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: W.aqua + '22', borderWidth: 1, borderColor: W.aqua + '44', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.aqua} strokeWidth={2.5}>
            <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      ) : denied ? (
        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: W.bg3, borderWidth: 1, borderColor: W.line }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: W.ink4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Negado
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onRequest}
          activeOpacity={0.85}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: W.coral }}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: 'white' }}>Permitir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface PermissionsStepProps {
  onDone: () => void;
}

function PermissionsStep({ onDone }: PermissionsStepProps) {
  const insets = useSafeAreaInsets();
  const [mediaStatus, setMediaStatus] = useState<PermStatus>('idle');
  const [locationStatus, setLocationStatus] = useState<PermStatus>('idle');

  // Check already-granted permissions on mount
  useEffect(() => {
    (async () => {
      const [media, loc] = await Promise.all([
        ImagePicker.getMediaLibraryPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
      ]);
      if (media.granted) setMediaStatus('granted');
      if (loc.granted) setLocationStatus('granted');
    })();
  }, []);

  // Auto-advance when both are resolved (granted or denied)
  useEffect(() => {
    if (mediaStatus !== 'idle' && locationStatus !== 'idle') {
      // Short delay so the user sees the final state before advancing
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [mediaStatus, locationStatus, onDone]);

  async function requestMedia() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setMediaStatus(granted ? 'granted' : 'denied');
  }

  async function requestLocation() {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(granted ? 'granted' : 'denied');
  }

  const allResolved = mediaStatus !== 'idle' && locationStatus !== 'idle';

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 32, color: W.ink, letterSpacing: -0.5 }}>
          WHERE<Text style={{ color: W.coral }}>·io</Text>
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.ink3, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>
          Cada lugar marcado é uma história
        </Text>
      </View>

      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.coral, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 }}>
          // Permissões
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 24, color: W.ink, letterSpacing: -0.3, lineHeight: 30 }}>
          Para uma melhor{'\n'}experiência
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: W.ink3, marginTop: 8, lineHeight: 19 }}>
          O WHERE·io precisa de acesso à galeria e à localização para funcionar corretamente.
        </Text>
      </View>

      {/* Permission cards */}
      <View style={{ gap: 12, marginBottom: 28 }}>
        <PermissionCard
          iconColor={W.violet}
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={W.violet} strokeWidth={1.8}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={W.violet} strokeWidth={1.8}>
                <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
                <Path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M12 3v12" strokeLinecap="round"/>
              </Svg>
            </Svg>
          }
          title="Galeria de fotos"
          description="Para adicionar fotos aos locais que você registrar."
          status={mediaStatus}
          onRequest={requestMedia}
        />

        <PermissionCard
          iconColor={W.aqua}
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={W.aqua} strokeWidth={1.8}>
              <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              <Circle cx={12} cy={10} r={3}/>
            </Svg>
          }
          title="Localização"
          description="Para mostrar onde você está no mapa e encontrar locais próximos."
          status={locationStatus}
          onRequest={requestLocation}
        />
      </View>

      {/* Skip / Continue */}
      <View style={{ gap: 12 }}>
        {!allResolved && (
          <TouchableOpacity
            onPress={onDone}
            activeOpacity={0.7}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: W.ink4 }}>
              Agora não
            </Text>
          </TouchableOpacity>
        )}
        {allResolved && (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <ActivityIndicator color={W.coral} size="small" />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main LoginScreen ─────────────────────────────────────────

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  // 'permissions' → show permissions step first; 'form' → show login form
  const [step, setStep] = useState<'permissions' | 'form'>('permissions');
  const stepOpacity = useRef(new Animated.Value(1)).current;

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabBarWidth, setTabBarWidth] = useState(0);

  const tabSlide = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const skipFormMountAnim = useRef(true);

  const segmentW = tabBarWidth > 0 ? (tabBarWidth - 8) / 2 : 0;

  // Transition from permissions step to form
  const handlePermissionsDone = useCallback(() => {
    Animated.timing(stepOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setStep('form');
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    });
  }, [stepOpacity]);

  useEffect(() => {
    Animated.spring(tabSlide, {
      toValue: tab === 'login' ? 0 : 1,
      useNativeDriver: true,
      tension: 280,
      friction: 26,
      overshootClamping: true,
    }).start();
  }, [tab, tabSlide]);

  useEffect(() => {
    if (skipFormMountAnim.current) {
      skipFormMountAnim.current = false;
      return;
    }
    formTranslateY.setValue(14);
    formOpacity.setValue(0.92);
    Animated.parallel([
      Animated.spring(formTranslateY, { toValue: 0, useNativeDriver: true, tension: 300, friction: 28 }),
      Animated.timing(formOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [tab, formOpacity, formTranslateY]);

  function onTabBarLayout(e: LayoutChangeEvent) {
    setTabBarWidth(e.nativeEvent.layout.width);
  }

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      const result =
        tab === 'login'
          ? await login(email, password, remember)
          : await register(email, password, nome, remember);
      if (!result.ok) {
        setError(result.message ?? 'Erro ao autenticar.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render permissions step ──
  if (step === 'permissions') {
    return (
      <Animated.View style={{ flex: 1, opacity: stepOpacity }}>
        <PermissionsStep onDone={handlePermissionsDone} />
      </Animated.View>
    );
  }

  // ── Render login form ──
  return (
    <Animated.View style={{ flex: 1, opacity: stepOpacity }}>
      <View style={{ flex: 1, backgroundColor: W.bg0 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 32, color: W.ink, letterSpacing: -0.5 }}>
                WHERE<Text style={{ color: W.coral }}>·io</Text>
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.ink3, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>
                Cada lugar marcado é uma história
              </Text>
            </View>

            {/* Tab switcher */}
            <View
              onLayout={onTabBarLayout}
              style={{ flexDirection: 'row', backgroundColor: W.bg2, borderRadius: 12, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: W.line, position: 'relative' }}
            >
              {segmentW > 0 && (
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', left: 4, top: 4, bottom: 4, width: segmentW,
                    borderRadius: 9, overflow: 'hidden',
                    transform: [{ translateX: tabSlide.interpolate({ inputRange: [0, 1], outputRange: [0, segmentW] }) }],
                  }}
                >
                  <LinearGradient colors={[W.coralSoft, W.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 9 }} />
                </Animated.View>
              )}
              {(['login', 'register'] as Tab[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9, zIndex: 1 }}
                  onPress={() => { setTab(t); setError(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: tab === t ? 'white' : W.ink3 }}>
                    {t === 'login' ? 'Entrar' : 'Criar conta'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form */}
            <Animated.View style={{ gap: 14, opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}>
              {tab === 'register' && (
                <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" autoComplete="name" />
              )}
              <Field
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <View>
                <Text style={labelStyle}>Senha</Text>
                <PasswordRow
                  value={password}
                  onChangeText={setPassword}
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword(p => !p)}
                />
              </View>

              {/* Remember */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: W.ink2 }}>Manter sessão ativa</Text>
                <Switch
                  value={remember}
                  onValueChange={setRemember}
                  trackColor={{ false: W.bg4, true: W.coral }}
                  thumbColor="white"
                />
              </View>
            </Animated.View>

            {/* Error */}
            {!!error && (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(255,107,94,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,107,94,0.3)' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.coral }}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity style={{ marginTop: 24 }} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={[W.coralSoft, W.coral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: 'white' }}>
                      {tab === 'login' ? 'Entrar' : 'Criar conta'}
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Animated.View>
  );
}

// ─── Sub-components ───────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, autoComplete }: FieldProps) {
  const focusDrive = useRef(new Animated.Value(0)).current;
  const borderColor = focusDrive.interpolate({ inputRange: [0, 1], outputRange: [W.line, W.coralSoft] });
  const backgroundColor = focusDrive.interpolate({ inputRange: [0, 1], outputRange: [W.bg2, '#1a2238'] });

  function setFocused(on: boolean) {
    Animated.timing(focusDrive, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }

  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      <Animated.View style={[baseInputChrome, { borderColor, backgroundColor }]}>
        <TextInput
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={W.ink4}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Animated.View>
    </View>
  );
}

interface PasswordRowProps {
  value: string;
  onChangeText: (t: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}

function PasswordRow({ value, onChangeText, showPassword, onToggleShow }: PasswordRowProps) {
  const focusDrive = useRef(new Animated.Value(0)).current;
  const borderColor = focusDrive.interpolate({ inputRange: [0, 1], outputRange: [W.line, W.coralSoft] });
  const backgroundColor = focusDrive.interpolate({ inputRange: [0, 1], outputRange: [W.bg2, '#1a2238'] });

  function setFocused(on: boolean) {
    Animated.timing(focusDrive, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }

  return (
    <Animated.View style={[baseInputChrome, { flexDirection: 'row', alignItems: 'center', borderColor, backgroundColor }]}>
      <TextInput
        style={[inputStyle, { flex: 1 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="••••••••"
        placeholderTextColor={W.ink4}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <TouchableOpacity onPress={onToggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={W.ink3} strokeWidth={2}>
          {showPassword
            ? <><Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><Path d="M1 1l22 22"/></>
            : <><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx={12} cy={12} r={3}/></>
          }
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

const baseInputChrome = {
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
};

const labelStyle = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: W.ink3,
  letterSpacing: 1.4,
  textTransform: 'uppercase' as const,
  marginBottom: 6,
};

const inputStyle = {
  fontFamily: fonts.body,
  fontSize: 14,
  color: W.ink,
};
