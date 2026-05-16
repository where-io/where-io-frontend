import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  bg?: string;
  intensity?: number;
}

export function GlassPanel({
  children,
  style,
  bg = 'rgba(20,27,54,0.85)',
  intensity = 20,
}: GlassPanelProps) {
  return (
    <View
      style={[
        { backgroundColor: bg },
        Platform.OS === 'web'
          ? ({
              backdropFilter: `blur(${intensity}px)`,
              WebkitBackdropFilter: `blur(${intensity}px)`,
            } as any)
          : {},
        ...(Array.isArray(style) ? style : [style]),
      ]}
    >
      {children}
    </View>
  );
}
