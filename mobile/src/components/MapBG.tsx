import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

export function MapBG() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={['#232e25', '#302825', '#252320']}
        start={{ x: 0.25, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'web' && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            } as any,
          ]}
        />
      )}
      <Svg
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 380 820"
        preserveAspectRatio="none"
      >
        <Path
          d="M-20 200 Q 100 220 200 270 T 400 340"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="3"
          fill="none"
        />
        <Path
          d="M50 -20 Q 80 200 150 420 T 200 850"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M-20 540 Q 150 510 280 580 T 400 640"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M-20 380 Q 90 360 180 380 T 400 410"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1.5"
          fill="none"
        />
      </Svg>
    </View>
  );
}
