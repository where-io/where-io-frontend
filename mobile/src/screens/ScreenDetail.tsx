import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  Modal, Pressable, TextInput, Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { LeafletMap } from '../components/LeafletMap';
import { useMapTheme } from '../context/MapThemeContext';
import { Mono, Display } from '../components/Typography';
import { GlassPanel } from '../components/GlassPanel';
import { LocalPhotosCarousel } from '../components/LocalPhotosCarousel';
import { LocationAddressCard } from '../components/LocationAddressCard';
import { W, fonts } from '../tokens';
import { Local, update as updateLocal } from '../service/LocaisService';
import { getByLocalId, remove as removeVisita, Visita } from '../service/VisitaService';

type RootParamList = {
  Detail: { location: Local; visitasRefreshKey?: number };
  RegistrarVisita: { localId: string; visita?: Visita };
};

/** API pode enviar lat/lng como string; valores podem estar ausentes. */
function formatCoordinate(value: unknown, decimals = 4): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n.toFixed(decimals) : '—';
}

export function ScreenDetail() {
  const { mapTheme } = useMapTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<any>();
  const location: Local = route.params?.location;
  const visitasRefreshKey: number | undefined = route.params?.visitasRefreshKey;

  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loadingVisitas, setLoadingVisitas] = useState(true);
  const [visitaToDelete, setVisitaToDelete] = useState<Visita | null>(null);
  const [deleteVisitaBusy, setDeleteVisitaBusy] = useState(false);
  const [deleteVisitaError, setDeleteVisitaError] = useState<string | null>(null);
  const [localName, setLocalName] = useState(location?.nome ?? '');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaveBusy, setNameSaveBusy] = useState(false);

  const loadVisitas = useCallback(() => {
    if (!location?.id) return;
    setLoadingVisitas(true);
    getByLocalId(location.id).then(v => {
      setVisitas(v);
      setLoadingVisitas(false);
    });
  }, [location?.id]);

  useFocusEffect(useCallback(() => {
    loadVisitas();
  }, [loadVisitas, visitasRefreshKey]));

  useEffect(() => {
    if (location?.nome) setLocalName(location.nome);
  }, [location?.id, location?.nome]);

  async function saveLocationName() {
    const trimmed = nameDraft.trim();
    if (!location?.id || !location.endereco || !trimmed || nameSaveBusy) return;
    if (trimmed === localName) {
      setEditingName(false);
      return;
    }
    setNameSaveBusy(true);
    try {
      const idTags = Array.isArray(location.idTags) && location.idTags.length > 0
        ? location.idTags
        : (location.tags?.map(t => t.id).filter(Boolean) as string[] | undefined) ?? [];
      const updated = await updateLocal(location.id, {
        nome: trimmed,
        endereco: location.endereco,
        coordenadas: location.coordenadas ?? undefined,
        idTags,
        ...(location.imagemUrl ? { imagemUrl: location.imagemUrl } : {}),
        ...(location.descricao ? { descricao: location.descricao } : {}),
      });
      if (updated) {
        setLocalName(updated.nome ?? trimmed);
        setEditingName(false);
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o nome. Tente novamente.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o nome. Tente novamente.');
    } finally {
      setNameSaveBusy(false);
    }
  }

  if (!location) {
    return (
      <View style={{ flex: 1, backgroundColor: W.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: W.ink3, fontFamily: fonts.body }}>Local não encontrado.</Text>
      </View>
    );
  }

  const pinColor = location.tags?.length === 1
    ? (location.tags[0].cor.startsWith('#') ? location.tags[0].cor : '#' + location.tags[0].cor)
    : W.coral;

  const avgRating = visitas.length > 0
    ? (visitas.reduce((s, v) => s + v.avaliacao, 0) / visitas.length).toFixed(1)
    : '—';

  async function confirmRemoveVisita() {
    if (!visitaToDelete || deleteVisitaBusy) return;
    setDeleteVisitaBusy(true);
    setDeleteVisitaError(null);
    try {
      const ok = await removeVisita(visitaToDelete.id);
      if (ok) {
        setVisitas(prev => prev.filter(v => v.id !== visitaToDelete.id));
        setVisitaToDelete(null);
      } else {
        setDeleteVisitaError('Não foi possível remover. Tente novamente.');
      }
    } catch {
      setDeleteVisitaError('Não foi possível remover. Tente novamente.');
    } finally {
      setDeleteVisitaBusy(false);
    }
  }

  function openEditVisita(visita: Visita) {
    navigation.navigate('RegistrarVisita', { localId: location.id, visita });
  }

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0 }}>
      <Modal
        visible={!!visitaToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleteVisitaBusy) {
            setVisitaToDelete(null);
            setDeleteVisitaError(null);
          }
        }}
      >
        <View style={visitModal.overlay}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, visitModal.backdrop]}
            onPress={() => {
              if (!deleteVisitaBusy) {
                setVisitaToDelete(null);
                setDeleteVisitaError(null);
              }
            }}
            accessibilityLabel="Fechar"
          />
          <View style={visitModal.sheet} accessibilityViewIsModal>
            <Mono size={11} style={{ letterSpacing: 1.4, marginBottom: 8 }}>Remover visita</Mono>
            {deleteVisitaError ? (
              <Text style={visitModal.error}>{deleteVisitaError}</Text>
            ) : null}
            <Text style={visitModal.message}>
              Deseja remover a visita de{' '}
              <Text style={{ fontFamily: fonts.bodySemiBold, color: W.ink }}>
                {visitaToDelete
                  ? new Date(visitaToDelete.dataVisita).toLocaleDateString('pt-BR')
                  : ''}
              </Text>
              ? Esta ação não pode ser desfeita.
            </Text>
            <View style={visitModal.actions}>
              <TouchableOpacity
                style={visitModal.btnGhost}
                onPress={() => { setVisitaToDelete(null); setDeleteVisitaError(null); }}
                disabled={deleteVisitaBusy}
                activeOpacity={0.8}
              >
                <Text style={visitModal.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={visitModal.btnDanger}
                onPress={confirmRemoveVisita}
                disabled={deleteVisitaBusy}
                activeOpacity={0.85}
              >
                <Text style={visitModal.btnDangerText}>
                  {deleteVisitaBusy ? 'Removendo…' : 'Remover'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Hero map */}
      <View style={{ height: 280, position: 'relative' }}>
        <LeafletMap locations={[location]} mapTheme={mapTheme} selectedLocationId={location.id} />
        <LinearGradient
          colors={['rgba(10,16,40,0.6)', 'transparent', 'transparent', '#0A1028']}
          locations={[0, 0.25, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 30 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <GlassPanel style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: W.line }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.ink} strokeWidth={2}>
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </GlassPanel>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ marginTop: -32, paddingHorizontal: 18 }}>
          {/* Tag badge */}
          {location.tags?.[0] && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: pinColor + '20', borderWidth: 1, borderColor: pinColor + '55', alignSelf: 'flex-start' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: pinColor }} />
              <Mono color={pinColor} size={10}>{location.tags[0].nome}</Mono>
            </View>
          )}

          <View style={nameEditStyles.row}>
            {editingName ? (
              <View style={nameEditStyles.editBlock}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  editable={!nameSaveBusy}
                  autoFocus
                  placeholder="Nome do local"
                  placeholderTextColor={W.ink4}
                  accessibilityLabel="Novo nome do local"
                  style={nameEditStyles.input}
                  returnKeyType="done"
                  onSubmitEditing={saveLocationName}
                />
                <View style={nameEditStyles.editActions}>
                  <TouchableOpacity
                    onPress={saveLocationName}
                    disabled={nameSaveBusy || !nameDraft.trim()}
                    style={[nameEditStyles.saveBtn, (nameSaveBusy || !nameDraft.trim()) && { opacity: 0.5 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={nameEditStyles.saveBtnText}>{nameSaveBusy ? 'Salvando…' : 'Salvar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setEditingName(false); setNameDraft(localName); }}
                    disabled={nameSaveBusy}
                    style={nameEditStyles.cancelBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={nameEditStyles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Display size={28} style={nameEditStyles.title}>{localName}</Display>
                {location.endereco ? (
                  <TouchableOpacity
                    onPress={() => { setNameDraft(localName); setEditingName(true); }}
                    style={nameEditStyles.iconBtn}
                    activeOpacity={0.75}
                    accessibilityLabel="Alterar nome do local"
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={W.ink2} strokeWidth={2} pointerEvents="none">
                      <Path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </Svg>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>

          {location.endereco?.logradouro && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={W.ink3} strokeWidth={2}>
                <Path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                <Circle cx={12} cy={10} r={3} />
              </Svg>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.ink3 }}>
                {location.endereco.logradouro}{location.endereco.cidade ? ` · ${location.endereco.cidade}, ${location.endereco.estado ?? ''}` : ''}
              </Text>
            </View>
          )}

          {/* Coordenadas */}
          <View style={{ marginTop: 16, backgroundColor: W.bg2, borderWidth: 1, borderColor: W.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row' }}>
            {[
              { k: 'LAT', v: formatCoordinate(location.coordenadas?.latitude), color: W.ink },
              { k: 'LON', v: formatCoordinate(location.coordenadas?.longitude), color: W.ink },
              { k: 'VISITAS', v: String(visitas.length), color: W.aqua },
            ].map((item, i) => (
              <View key={i} style={{ flex: 1 }}>
                <Mono size={9} style={{ letterSpacing: 1.8 }}>{item.k}</Mono>
                <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: item.color, marginTop: 2 }}>{item.v}</Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[
              { k: 'Visitas', v: String(visitas.length) },
              { k: 'Avaliação', v: avgRating },
              { k: 'Tags', v: String(location.tags?.length ?? 0) },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: W.bg2, borderWidth: 1, borderColor: W.lineSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                <Mono size={9}>{s.k}</Mono>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: W.ink, marginTop: 2 }}>{s.v}</Text>
              </View>
            ))}
          </View>

          {/* Descrição */}
          {location.descricao && (
            <View style={{ marginTop: 14 }}>
              <Mono>Descrição</Mono>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: W.ink2, marginTop: 6, lineHeight: 20 }}>{location.descricao}</Text>
            </View>
          )}

          <LocationAddressCard endereco={location.endereco} />
          <LocalPhotosCarousel localId={location.id} />

          {loadingVisitas && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color={W.coral} />
            </View>
          )}

          {/* Visitas — no final do conteúdo */}
          {visitas.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <View style={visitStyles.sectionHeader}>
                <Mono>Visitas registradas</Mono>
                <Text style={visitStyles.count}>{visitas.length}</Text>
              </View>
              <View style={{ gap: 10 }}>
                {visitas.map(v => (
                  <View key={v.id} style={visitStyles.card}>
                    <View style={visitStyles.cardTop}>
                      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                        <Text style={visitStyles.date}>
                          {new Date(v.dataVisita).toLocaleDateString('pt-BR')}
                        </Text>
                        <View style={visitStyles.stars}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Text
                              key={star}
                              style={{ fontSize: 12, color: star <= v.avaliacao ? W.amber : W.bg4 }}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                      </View>
                      <View style={visitStyles.actions}>
                        <TouchableOpacity
                          onPress={() => openEditVisita(v)}
                          style={visitStyles.iconBtn}
                          activeOpacity={0.75}
                          accessibilityLabel="Editar visita"
                        >
                          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={W.ink2} strokeWidth={2} pointerEvents="none">
                            <Path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </Svg>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { setDeleteVisitaError(null); setVisitaToDelete(v); }}
                          style={[visitStyles.iconBtn, visitStyles.iconBtnDanger]}
                          activeOpacity={0.75}
                          accessibilityLabel="Remover visita"
                        >
                          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={W.coral} strokeWidth={2} pointerEvents="none">
                            <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </Svg>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {v.comentario ? (
                      <Text style={visitStyles.comment}>{v.comentario}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={{ position: 'absolute', bottom: Math.max(insets.bottom + 10, 24), left: 16, right: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('RegistrarVisita', { localId: location.id })}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[W.coralSoft, W.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text style={{ color: 'white', fontFamily: fonts.bodySemiBold, fontSize: 14 }}>Registrar Visita</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const nameEditStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  title: {
    flex: 1,
    flexShrink: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: W.line,
    backgroundColor: W.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  editBlock: {
    flex: 1,
    gap: 10,
  },
  input: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: W.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: W.line,
    backgroundColor: W.bg2,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94,224,200,0.35)',
    backgroundColor: 'rgba(94,224,200,0.12)',
  },
  saveBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: W.aqua,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: W.line,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: W.ink2,
  },
});

const visitStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: W.ink3,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: W.bg2,
    borderWidth: 1,
    borderColor: W.lineSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: W.ink3,
    letterSpacing: 1.1,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: W.line,
    backgroundColor: W.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    borderColor: 'rgba(255,107,94,0.22)',
    backgroundColor: 'rgba(255,107,94,0.08)',
  },
  comment: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: W.ink2,
    lineHeight: 20,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: W.lineSoft,
  },
});

const visitModal = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    backgroundColor: 'rgba(8,10,22,0.72)',
    zIndex: 0,
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
