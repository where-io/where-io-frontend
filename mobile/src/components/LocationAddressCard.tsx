import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  Clipboard,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Mono } from './Typography';
import { W, fonts } from '../tokens';
import type { Endereco } from '../service/LocaisService';

/** Mesma regra que `formatEndereco` em `web/src/pages/Home.jsx`. */
export function formatEndereco(endereco: Endereco | undefined): string {
  if (!endereco || typeof endereco !== 'object') return '—';
  const cidadeEstado = [endereco.cidade, endereco.estado].filter(Boolean).join(' - ');
  const parts = [
    endereco.logradouro,
    endereco.bairro,
    cidadeEstado || null,
    endereco.cep,
    endereco.pais,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

interface Props {
  endereco: Endereco | undefined;
}

export function LocationAddressCard({ endereco }: Props) {
  const full = formatEndereco(endereco);
  const canCopy = full !== '—' && String(full).trim() !== '';

  function onCopy() {
    if (!canCopy) return;
    try {
      Clipboard.setString(full);
    } catch {
      Alert.alert('Copiar', 'Não foi possível copiar o endereço.');
    }
  }

  function onUber() {
    if (!canCopy) return;
    const url = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(full)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Uber', 'Não foi possível abrir o link. Tente novamente.');
    });
  }

  return (
    <View style={styles.card}>
      <View style={{ minWidth: 0 }}>
        <Mono size={9} style={{ letterSpacing: 1.7 }}>Endereço</Mono>
        <View style={styles.valueRow}>
          <Text style={styles.addressText} selectable>
            {full}
          </Text>
          <Svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={W.coral}
            strokeWidth={2}
            style={{ opacity: 0.5, flexShrink: 0, marginTop: 2 }}
          >
            <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
            <Circle cx={12} cy={10} r={3} />
          </Svg>
        </View>
      </View>

      {canCopy ? (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCopy}
            style={styles.iconAction}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Copiar endereço"
          >
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={W.coral}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" />
              <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onUber}
            style={styles.uberBtn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Abrir Uber com este endereço como destino"
          >
            <Text style={styles.uberText}>Uber</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: W.bg2,
    borderWidth: 1,
    borderColor: W.lineSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  addressText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 14,
    lineHeight: 20,
    color: W.ink,
  },
  actions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconAction: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: -0.2,
  },
});
