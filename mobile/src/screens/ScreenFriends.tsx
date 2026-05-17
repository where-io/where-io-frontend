import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
  Alert, Modal, Pressable, StyleSheet, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Mono, Display } from '../components/Typography';
import { W, fonts } from '../tokens';
import {
  listFriends, listConvitesRecebidos, listConvitesEnviados,
  enviarConvite, aceitarConvite, cancelarOuRecusarConvite, removerAmigo,
  Amigo, Convite,
} from '../service/AmigosService';
import { useLocationSharing } from '../context/LocationSharingContext';

type TabId = 'amigos' | 'recebidos' | 'enviados';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    zIndex: 2,
    borderRadius: 14,
    padding: 18,
    backgroundColor: W.bg3,
    borderWidth: 1,
    borderColor: W.line,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: W.ink2,
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnGhostText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.ink3,
  },
  btnDanger: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,94,0.22)',
  },
  btnDangerText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.coral,
    fontWeight: '600',
  },
  removeBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,94,0.18)',
  },
});

const AVATAR_GRADIENTS: [string, string][] = [
  ['#8C7BFF', '#FF6B9D'],
  ['#5EE0C8', '#5EB7FF'],
  ['#F2B95C', '#FF6B5E'],
  ['#FF6B9D', '#FF6B5E'],
  ['#6E7699', '#4A5176'],
];

function avatarGradient(index: number): [string, string] {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export function ScreenFriends() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>('amigos');
  const [friends, setFriends] = useState<Amigo[]>([]);
  const [recebidos, setRecebidos] = useState<Convite[]>([]);
  const [enviados, setEnviados] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeConvite, setNomeConvite] = useState('');
  const [sendingConvite, setSendingConvite] = useState(false);
  const [toRemove, setToRemove] = useState<Amigo | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const { toggles, setToggle } = useLocationSharing();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [f, r, e] = await Promise.all([
      listFriends(),
      listConvitesRecebidos(),
      listConvitesEnviados(),
    ]);
    setFriends(f);
    setRecebidos(r);
    setEnviados(e);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  async function handleEnviarConvite() {
    if (!nomeConvite.trim()) return;
    setSendingConvite(true);
    const ok = await enviarConvite(nomeConvite.trim());
    setSendingConvite(false);
    if (ok) {
      setNomeConvite('');
      fetchAll();
    } else {
      Alert.alert('Erro', 'Não foi possível enviar o convite. Verifique o nome de usuário.');
    }
  }

  async function handleAceitar(id: string) {
    const ok = await aceitarConvite(id);
    if (ok) fetchAll();
  }

  async function handleRecusar(id: string) {
    const ok = await cancelarOuRecusarConvite(id);
    if (ok) fetchAll();
  }

  async function confirmRemoverAmigo() {
    if (!toRemove || removeBusy) return;
    setRemoveBusy(true);
    const ok = await removerAmigo(toRemove.id);
    setRemoveBusy(false);
    if (ok) {
      setFriends(prev => prev.filter(f => f.id !== toRemove.id));
      setToRemove(null);
    } else {
      Alert.alert('Erro', 'Não foi possível remover o amigo.');
    }
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'amigos', label: 'Amigos', count: friends.length },
    { id: 'recebidos', label: 'Recebidos', count: recebidos.length },
    { id: 'enviados', label: 'Enviados', count: enviados.length },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0, paddingTop: insets.top }}>
      <Modal
        visible={!!toRemove}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!removeBusy) setToRemove(null); }}
      >
        <View style={styles.overlay}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, { zIndex: 0, backgroundColor: 'rgba(8,10,22,0.72)' }]}
            onPress={() => { if (!removeBusy) setToRemove(null); }}
            accessibilityLabel="Fechar"
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <Mono size={11} style={{ letterSpacing: 1.4, marginBottom: 8 }}>Remover amigo</Mono>
            <Text style={styles.message}>
              Deseja remover{' '}
              <Text style={{ fontFamily: fonts.bodySemiBold, color: W.ink }}>{toRemove?.nome}</Text>
              {' '}da sua lista de amigos?
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => setToRemove(null)}
                disabled={removeBusy}
                activeOpacity={0.8}
              >
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDanger}
                onPress={confirmRemoverAmigo}
                disabled={removeBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.btnDangerText}>{removeBusy ? 'Removendo…' : 'Remover'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Mono color={W.coral}>// CONSTELLATION</Mono>
          <Display size={30} style={{ marginTop: 6 }}>Amigos</Display>
        </View>
      </View>

      {/* Enviar convite */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: W.ink }}
            value={nomeConvite}
            onChangeText={setNomeConvite}
            placeholder="@nome_de_usuario"
            placeholderTextColor={W.ink4}
            autoCapitalize="none"
            returnKeyType="send"
            onSubmitEditing={handleEnviarConvite}
          />
          <TouchableOpacity
            onPress={handleEnviarConvite}
            disabled={sendingConvite || !nomeConvite.trim()}
            style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: W.coral, alignItems: 'center', justifyContent: 'center', opacity: nomeConvite.trim() ? 1 : 0.4 }}
            activeOpacity={0.8}
          >
            {sendingConvite
              ? <ActivityIndicator size="small" color="white" />
              : <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4}>
                  <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </Svg>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', backgroundColor: W.bg2, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: W.line }}>
          {tabs.map(t => {
            const active = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 }}
                onPress={() => setActiveTab(t.id)}
                activeOpacity={0.8}
              >
                {active && (
                  <View style={{ position: 'absolute', inset: 0, backgroundColor: W.bg4, borderRadius: 9 } as any} />
                )}
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: active ? W.ink : W.ink3 }}>
                  {t.label}
                  {t.count > 0 ? ` · ${t.count}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={W.coral} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 8 }}>
          {/* Amigos */}
          {activeTab === 'amigos' && friends.map((f, i) => (
            <View key={f.id} style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.lineSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ position: 'relative' }}>
                <LinearGradient
                  colors={avatarGradient(i)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontFamily: fonts.display, fontSize: 13, color: 'white' }}>{getInitials(f.nome)}</Text>
                </LinearGradient>
                <View style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: 5.5, backgroundColor: f.online ? W.aqua : W.ink4, borderWidth: 2, borderColor: W.bg2 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: W.ink }}>{f.nome}</Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.ink3, marginTop: 2, letterSpacing: 0.8 }}>@{f.nomeUsuario}</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: f.online ? 'rgba(94,224,200,0.12)' : W.bg3, borderWidth: 1, borderColor: f.online ? 'rgba(94,224,200,0.3)' : W.line }}>
                <Mono size={9} color={f.online ? W.aqua : W.ink4}>{f.online ? 'online' : 'offline'}</Mono>
              </View>
              <Switch
                value={!!toggles[f.id]}
                onValueChange={(val) => setToggle(f.id, val)}
                trackColor={{ false: W.bg3, true: 'rgba(94,224,200,0.4)' }}
                thumbColor={toggles[f.id] ? W.aqua : W.ink4}
                ios_backgroundColor={W.bg3}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
              <TouchableOpacity
                onPress={() => setToRemove(f)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Remover amigo"
                style={styles.removeBtn}
                activeOpacity={0.7}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.coral} strokeWidth={2}>
                  <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </Svg>
              </TouchableOpacity>
            </View>
          ))}

          {activeTab === 'amigos' && friends.length === 0 && (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: W.ink3 }}>Nenhum amigo ainda.</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.ink4, marginTop: 4 }}>Envie um convite pelo campo acima.</Text>
            </View>
          )}

          {/* Convites recebidos */}
          {activeTab === 'recebidos' && recebidos.map((c, i) => (
            <View key={c.id} style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.lineSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient
                colors={avatarGradient(i)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.display, fontSize: 13, color: 'white' }}>{getInitials(c.nome)}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: W.ink }}>{c.nome}</Text>
                {c.nomeUsuario && <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.ink3, marginTop: 2 }}>@{c.nomeUsuario}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleAceitar(c.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: W.coral }} activeOpacity={0.8}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: 'white' }}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRecusar(c.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: W.bg3, borderWidth: 1, borderColor: W.line }} activeOpacity={0.8}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: W.ink3 }}>Recusar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {activeTab === 'recebidos' && recebidos.length === 0 && (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: W.ink3 }}>Nenhum convite recebido.</Text>
            </View>
          )}

          {/* Convites enviados */}
          {activeTab === 'enviados' && enviados.map((c, i) => (
            <View key={c.id} style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.lineSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient
                colors={avatarGradient(i)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.display, fontSize: 13, color: 'white' }}>{getInitials(c.nome)}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: W.ink }}>{c.nome}</Text>
                {c.nomeUsuario && <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.ink3, marginTop: 2 }}>@{c.nomeUsuario}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleRecusar(c.id)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: W.bg3, borderWidth: 1, borderColor: W.line }} activeOpacity={0.8}>
                <Mono size={9} color={W.ink4}>Cancelar</Mono>
              </TouchableOpacity>
            </View>
          ))}

          {activeTab === 'enviados' && enviados.length === 0 && (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: W.ink3 }}>Nenhum convite enviado.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
