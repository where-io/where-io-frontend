import React from 'react';
import { View, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { W } from '../tokens';

interface PinProps {
  left: string | number;
  top: string | number;
  color?: string;
  scale?: number;
  visited?: boolean;
}

export function Pin({ left, top, color = W.coral, scale = 1, visited = false }: PinProps) {
  const w = 26 * scale;
  const h = 34 * scale;

  return (
    <View
      style={{
        position: 'absolute',
        left: left as any,
        top: top as any,
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h,
        ...(Platform.OS === 'web'
          ? ({ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.55))' } as any)
          : {}),
      }}
    >
      <Svg width={w} height={h} viewBox="0 0 32 42" fill="none">
        <Path
          d="M16 41s13-13.5 13-25A13 13 0 1 0 3 16c0 11.5 13 25 13 25z"
          fill={color}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
        />
        {visited ? (
          <Path
            d="M11 16l3.5 3.5L21 13"
            stroke="#0A1028"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Circle cx="16" cy="16" r="4.5" fill="white" />
        )}
      </Svg>
    </View>
  );
}
