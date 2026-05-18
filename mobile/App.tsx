import 'text-encoding'; // polyfill TextDecoder/TextEncoder for @stomp/stompjs on React Native
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MapThemeProvider } from './src/context/MapThemeContext';
import { LocationSharingProvider } from './src/context/LocationSharingContext';
import { ScreenMap } from './src/screens/ScreenMap';
import { ScreenCollection } from './src/screens/ScreenCollection';
import { ScreenCreate } from './src/screens/ScreenCreate';
import { ScreenDetail } from './src/screens/ScreenDetail';
import { ScreenSettings } from './src/screens/ScreenSettings';
import { ScreenFriends } from './src/screens/ScreenFriends';
import { ScreenRegistrarVisita } from './src/screens/ScreenRegistrarVisita';
import { LoginScreen } from './src/screens/LoginScreen';
import { CustomTabBar } from './src/components/CustomTabBar';
import { Local } from './src/service/LocaisService';
import type { Visita } from './src/service/VisitaService';
import { W } from './src/tokens';

SplashScreen.preventAutoHideAsync();

// ─── Navigation types ────────────────────────────────────────
type RootStackParamList = {
  MainTabs: undefined;
  Detail: { location: Local; visitasRefreshKey?: number };
  Create: undefined;
  RegistrarVisita: { localId: string; visita?: Visita };
};

type MainTabParamList = {
  Map: { focusNewLocal?: { id: string; lat: number; lng: number } } | undefined;
  Collection: undefined;
  Friends: undefined;
  Profile: undefined;
};

type AuthStackParamList = {
  Login: undefined;
};

// ─── Navigators ──────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Map" component={ScreenMap} />
      <Tab.Screen name="Collection" component={ScreenCollection} />
      <Tab.Screen name="Friends" component={ScreenFriends} />
      <Tab.Screen name="Profile" component={ScreenSettings} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg0 } }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="Detail"
        component={ScreenDetail}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <RootStack.Screen
        name="Create"
        component={ScreenCreate}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <RootStack.Screen
        name="RegistrarVisita"
        component={ScreenRegistrarVisita}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </RootStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.bg0 } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Root content (reads auth state) ─────────────────────────
function RootContent() {
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: W.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={W.coral} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ─── App entry ───────────────────────────────────────────────
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: W.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={W.coral} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={W.bg0} />
      <AuthProvider>
        <MapThemeProvider>
          <LocationSharingProvider>
            <RootContent />
          </LocationSharingProvider>
        </MapThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
