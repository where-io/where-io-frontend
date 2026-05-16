import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { Mono, Display } from '../components/Typography';
import { W, fonts } from '../tokens';
import { getAll, remove, Local, Tag } from '../service/LocaisService';
import { getAll as getAllTags } from '../service/TagService';

type RootParamList = { Detail: { location: Local }; Create: undefined };

export function ScreenCollection() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();

  const [locations, setLocations] = useState<Local[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  /** Local marcado para exclusão — modal substitui `Alert` (stub no react-native-web). */
  const [toDelete, setToDelete] = useState<Local | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [locs, tags] = await Promise.all([getAll(), getAllTags()]);
    setLocations(locs);
    setAllTags(tags);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filtered = locations.filter(loc => {
    const matchTag = !activeTagId || loc.tags?.some(t => t.id === activeTagId);
    const matchSearch = !searchText || loc.nome.toLowerCase().includes(searchText.toLowerCase());
    return matchTag && matchSearch;
  });

  async function confirmRemove() {
    if (!toDelete || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const ok = await remove(toDelete.id);
      if (ok) {
        setLocations(prev => prev.filter(l => l.id !== toDelete.id));
        setToDelete(null);
      } else {
        setDeleteError('Não foi possível remover. Verifique sua sessão ou tente de novo.');
      }
    } catch {
      setDeleteError('Não foi possível remover. Verifique sua sessão ou tente de novo.');
    } finally {
      setDeleteBusy(false);
    }
  }

  function tagColor(tag: Tag): string {
    return tag.cor.startsWith('#') ? tag.cor : '#' + tag.cor;
  }

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0, paddingTop: insets.top }}>
      <Modal
        visible={!!toDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleteBusy) {
            setToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <View style={modalStyles.overlay}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, { zIndex: 0, backgroundColor: 'rgba(8,10,22,0.72)' }]}
            onPress={() => {
              if (!deleteBusy) {
                setToDelete(null);
                setDeleteError(null);
              }
            }}
            accessibilityLabel="Fechar"
          />
          <View style={modalStyles.sheet} accessibilityViewIsModal>
            <Mono size={11} style={{ letterSpacing: 1.4, marginBottom: 8 }}>Remover local</Mono>
            {deleteError ? (
              <Text style={modalStyles.error}>{deleteError}</Text>
            ) : null}
            <Text style={modalStyles.message}>
              Deseja remover{' '}
              <Text style={{ fontFamily: fonts.bodySemiBold, color: W.ink }}>{toDelete?.nome}</Text>
              ? Esta ação não pode ser desfeita.
            </Text>
            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={modalStyles.btnGhost}
                onPress={() => { setToDelete(null); setDeleteError(null); }}
                disabled={deleteBusy}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.btnDanger}
                onPress={confirmRemove}
                disabled={deleteBusy}
                activeOpacity={0.85}
              >
                <Text style={modalStyles.btnDangerText}>{deleteBusy ? 'Removendo…' : 'Remover'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={W.coral} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14 }}>
            <Mono color={W.coral}>// MY ATLAS</Mono>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <Display size={30}>Coleção</Display>
              <Mono>{locations.length} {locations.length === 1 ? 'lugar' : 'lugares'}</Mono>
            </View>
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <View style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.ink3} strokeWidth={2}>
                <Circle cx={11} cy={11} r={7} />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
              <TextInput
                style={{ fontSize: 13, color: W.ink, fontFamily: fonts.body, flex: 1 }}
                placeholder="Buscar nas coleções…"
                placeholderTextColor={W.ink3}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          {/* Tag filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 6 }}>
            <TouchableOpacity
              onPress={() => setActiveTagId(null)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: !activeTagId ? 'rgba(255,107,94,0.12)' : 'transparent', borderWidth: 1, borderColor: !activeTagId ? 'rgba(255,107,94,0.3)' : W.line, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 11, color: !activeTagId ? W.coral : W.ink2, fontFamily: fonts.body }}>Todos</Text>
              <Mono color={!activeTagId ? W.coral : W.ink3} size={9} style={{ opacity: 0.7 }}>{locations.length}</Mono>
            </TouchableOpacity>
            {allTags.map(tag => {
              const active = activeTagId === tag.id;
              const count = locations.filter(l => l.tags?.some(t => t.id === tag.id)).length;
              return (
                <TouchableOpacity key={tag.id} onPress={() => setActiveTagId(active ? null : tag.id)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? 'rgba(255,107,94,0.12)' : 'transparent', borderWidth: 1, borderColor: active ? 'rgba(255,107,94,0.3)' : W.line, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tagColor(tag) }} />
                  <Text style={{ fontSize: 11, color: active ? W.coral : W.ink2, fontFamily: fonts.body }}>{tag.nome}</Text>
                  <Mono color={active ? W.coral : W.ink3} size={9} style={{ opacity: 0.7 }}>{count}</Mono>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* List */}
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            {filtered.length === 0 && (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: W.ink3 }}>Nenhum local encontrado.</Text>
              </View>
            )}
            {filtered.map(loc => {
              const color = loc.tags?.[0] ? tagColor(loc.tags[0]) : W.coral;
              return (
                <View
                  key={loc.id}
                  style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.lineSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Detail', { location: loc })}
                    activeOpacity={0.85}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: color + '55', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: fonts.display, fontSize: 12, color }}>{loc.nome[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: W.ink }}>{loc.nome}</Text>
                      <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 10.5, color: W.ink3, marginTop: 2 }}>
                        {loc.endereco?.logradouro ?? ''}{loc.endereco?.cidade ? ` · ${loc.endereco.cidade}` : ''}
                      </Text>
                    </View>
                    {loc.tags?.[0] && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: color + '18', borderWidth: 1, borderColor: color + '44' }}>
                        <Text style={{ fontFamily: fonts.mono, fontSize: 9, color, textTransform: 'uppercase', letterSpacing: 0.8 }}>{loc.tags[0].nome}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setDeleteError(null); setToDelete(loc); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Remover local"
                    style={listRowStyles.deleteHit}
                    activeOpacity={0.7}
                  >
                    <Svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={W.ink4}
                      strokeWidth={2}
                      pointerEvents="none"
                    >
                      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const modalStyles = StyleSheet.create({
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
  error: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: W.coral,
    marginBottom: 10,
    lineHeight: 17,
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
});

const listRowStyles = StyleSheet.create({
  deleteHit: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    zIndex: 10,
  },
});
