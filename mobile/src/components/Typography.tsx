import React from 'react';
import { Text, TextStyle } from 'react-native';
import { W, fonts } from '../tokens';

interface MonoProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: TextStyle;
}

export function Mono({ children, color = W.ink3, size = 10, style }: MonoProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.mono,
          fontSize: size,
          letterSpacing: size * 0.16,
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

interface DisplayProps {
  children: React.ReactNode;
  size?: number;
  style?: TextStyle;
}

export function Display({ children, size = 28, style }: DisplayProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.display,
          letterSpacing: -0.4,
          lineHeight: size * 1.05,
          fontSize: size,
          color: W.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
