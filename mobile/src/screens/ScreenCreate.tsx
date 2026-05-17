import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, StyleSheet,
  Modal, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Mono } from '../components/Typography';
import { W, fonts } from '../tokens';
import { create, Tag, CategoriaPayload } from '../service/LocaisService';
import { apiFetch } from '../service/apiClient';

const TAG_PALETTE = [
  { name: 'Coral', value: '#FF6B5E' },
  { name: 'Aqua', value: '#4DE1C1' },
  { name: 'Violet', value: '#8B7CFF' },
  { name: 'Amber', value: '#FFB84D' },
  { name: 'Lime', value: '#7CFF6B' },
  { name: 'Sky', value: '#5EBBFF' },
] as const;

function createPlacesSessionToken(): string {
  return `ps-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function resolveTagHex(cor: string | undefined | null): string {
  if (cor == null || String(cor).trim() === '') return '#FF6B5E';
  const s = String(cor).trim();
  if (s.startsWith('#')) {
    const body = s.slice(1);
    if (body.length === 3 || body.length === 6) return `#${body}`;
    return s;
  }
  if (/^[\dA-Fa-f]{3}$|^[\dA-Fa-f]{6}$/i.test(s)) return `#${s}`;
  return '#FF6B5E';
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = resolveTagHex(hex);
  if (!normalized.startsWith('#')) return `rgba(255,255,255,${alpha})`;
  const clean = normalized.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (full.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type SelectedTag = { id?: string; nome: string; cor: string };

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

interface PlaceDetails {
  lat: number;
  lng: number;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
  formattedAddress?: string;
}

function formatAddressSummary(place: PlaceDetails): string {
  if (place.formattedAddress?.trim()) return place.formattedAddress.trim();
  const parts = [place.logradouro, place.bairro, place.cidade, place.estado].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}

/** Autocomplete via API (evita CORS no web e centraliza a chave Google no backend). */
async function fetchPlaceSuggestions(input: string, sessionToken: string): Promise<PlaceSuggestion[]> {
  if (input.trim().length <= 3) return [];
  try {
    const res = await apiFetch('/api/local/buscar-local', {
      method: 'POST',
      body: JSON.stringify({
        inputText: input,
        sessionToken: sessionToken || undefined,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.predictions ?? [];
  } catch {
    return [];
  }
}

async function fetchPlaceDetailsFromApi(placeId: string): Promise<PlaceDetails | null> {
  try {
    const res = await apiFetch(`/api/local/place-details/${encodeURIComponent(placeId)}`);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      lat: d.lat,
      lng: d.lng,
      logradouro: d.logradouro,
      bairro: d.bairro,
      cidade: d.cidade,
      estado: d.estado,
      cep: d.cep,
      pais: d.pais,
      formattedAddress: d.formattedAddress,
    };
  } catch {
    return null;
  }
}

export function ScreenCreate() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const placesSessionRef = useRef(createPlacesSessionToken());

  const [nome, setNome] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsLoadError, setTagsLoadError] = useState(false);
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [tagDraftOpen, setTagDraftOpen] = useState(false);
  const [tagNameDraft, setTagNameDraft] = useState('');
  const [tagColorDraft, setTagColorDraft] = useState('#8B7CFF');
  const [addressFocused, setAddressFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!tagDraftOpen) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [tagDraftOpen]);

  useEffect(() => {
    let cancel = false;
    setTagsLoading(true);
    setTagsLoadError(false);
    apiFetch('/api/tag/all')
      .then(r => {
        if (!r.ok) throw new Error('tags');
        return r.json();
      })
      .then((data: unknown) => {
        if (cancel || !Array.isArray(data)) return;
        setAllTags(data as Tag[]);
      })
      .catch(() => {
        if (!cancel) {
          setTagsLoadError(true);
          setAllTags([]);
        }
      })
      .finally(() => {
        if (!cancel) setTagsLoading(false);
      });
    return () => { cancel = true; };
  }, []);

  function onAddressChange(text: string) {
    setAddressInput(text);
    if (placeDetails) setPlaceDetails(null);

    const trimmed = text.trim();
    if (trimmed.length <= 3) {
      setSuggestions([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = null;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchPlaceSuggestions(trimmed, placesSessionRef.current);
      setSuggestions(results);
    }, 400);
  }

  async function selectSuggestion(s: PlaceSuggestion) {
    setSuggestions([]);
    setAddressInput(s.description);
    setLoading(true);
    const details = await fetchPlaceDetailsFromApi(s.place_id);
    setPlaceDetails(details);
    setLoading(false);
  }

  function toggleRegisteredTag(apiTag: Tag) {
    const id = apiTag?.id;
    if (!id) return;
    setSelectedTags(prev => {
      const on = prev.some(t => t.id === id);
      if (on) return prev.filter(t => t.id !== id);
      return [...prev, { id, nome: apiTag.nome, cor: resolveTagHex(apiTag.cor) }];
    });
  }

  function removeTag(tag: SelectedTag) {
    const id = tag?.id;
    const normalized = (tag?.nome ?? '').trim().toLowerCase();
    setSelectedTags(prev =>
      prev.filter(t => {
        if (id && t.id) return t.id !== id;
        return (t?.nome ?? '').trim().toLowerCase() !== normalized;
      }),
    );
  }

  function addTagFromDraft() {
    const nomeTag = tagNameDraft.trim();
    if (!nomeTag) return;
    const lower = nomeTag.toLowerCase();
    const existsInSelection = selectedTags.some(
      t => (t?.nome ?? '').trim().toLowerCase() === lower,
    );
    const existsInCatalog = allTags.some(
      t => (t?.nome ?? '').trim().toLowerCase() === lower,
    );
    if (existsInSelection || existsInCatalog) return;
    setSelectedTags(prev => [...prev, { nome: nomeTag, cor: resolveTagHex(tagColorDraft) }]);
    setTagNameDraft('');
    setTagDraftOpen(false);
  }

  async function handleSubmit() {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe o nome do local.'); return; }
    if (!placeDetails) { Alert.alert('Atenção', 'Selecione um endereço nas sugestões.'); return; }

    setSubmitting(true);
    try {
      const idTags = selectedTags
        .map(t => (t.id && String(t.id).trim()) || (t.nome && t.nome.trim()))
        .filter(Boolean) as string[];

      const tagsPayload: CategoriaPayload[] = selectedTags.map(({ id, nome, cor }) => ({
        ...(id ? { id } : {}),
        nome,
        cor: resolveTagHex(cor),
      }));

      const payload = {
        nome: nome.trim(),
        coordenadas: { latitude: placeDetails.lat, longitude: placeDetails.lng },
        endereco: {
          logradouro: placeDetails.logradouro,
          bairro: placeDetails.bairro,
          cidade: placeDetails.cidade,
          estado: placeDetails.estado,
          cep: placeDetails.cep,
          pais: placeDetails.pais,
        },
        idTags,
        tags: tagsPayload,
      };

      const newId = await create(payload);
      if (newId) {
        setSuccessPayload({
          id: newId,
          name: nome.trim(),
          address: formatAddressSummary(placeDetails),
          lat: placeDetails.lat,
          lng: placeDetails.lng,
        });
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o local. Tente novamente.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o local. Verifique a conexão e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function dismissSuccessModal() {
    setSuccessPayload(null);
    navigation.goBack();
  }

  function confirmSuccessGoToMap() {
    if (!successPayload) return;
    const s = successPayload;
    setSuccessPayload(null);
    (navigation as any).navigate('MainTabs', {
      screen: 'Map',
      params: { focusNewLocal: { id: s.id, lat: s.lat, lng: s.lng } },
    });
    navigation.goBack();
  }

  const iconBtn = {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: W.bg2,
    borderWidth: 1,
    borderColor: W.line,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const fieldStyle = {
    backgroundColor: W.bg2,
    borderWidth: 1,
    borderColor: W.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  };

  const tagDraftUiColor = resolveTagHex(tagColorDraft);
  const submitBarBottom = Math.max(insets.bottom + 10, 28);
  /** Desloca o CTA fixo para baixo quando o painel de nova tag está aberto. */
  const tagDraftSubmitShift = tagDraftOpen ? 72 : 0;
  const scrollBottomPad = 120 + (tagDraftOpen ? 200 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0, paddingTop: insets.top }}>
      <Modal
        visible={!!successPayload}
        transparent
        animationType="fade"
        onRequestClose={dismissSuccessModal}
      >
        <View style={successModal.overlay}>
          <Pressable style={[StyleSheet.absoluteFillObject, successModal.backdrop]} onPress={dismissSuccessModal} />
          <View style={successModal.sheet}>
            <Mono size={10} color={W.aqua} style={{ letterSpacing: 1.6, marginBottom: 10 }}>
              // novo pino · atlas
            </Mono>
            <Text style={successModal.title}>{successPayload?.name}</Text>
            {!!successPayload?.address && (
              <Text style={successModal.meta} numberOfLines={3}>{successPayload.address}</Text>
            )}
            <View style={successModal.coordsRow}>
              <Text style={successModal.coordVal}>
                {successPayload ? `${successPayload.lat.toFixed(5)}, ${successPayload.lng.toFixed(5)}` : ''}
              </Text>
              <View style={successModal.dash} />
              <Text style={successModal.saved}>salvo</Text>
            </View>
            <View style={successModal.actions}>
              <TouchableOpacity style={successModal.btnSecondary} onPress={dismissSuccessModal} activeOpacity={0.85}>
                <Text style={successModal.btnSecondaryText}>Dispensar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={successModal.btnPrimary} onPress={confirmSuccessGoToMap} activeOpacity={0.9}>
                <Text style={successModal.btnPrimaryText}>Ver no mapa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={iconBtn} activeOpacity={0.8}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.ink2} strokeWidth={2}>
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Mono>Novo local</Mono>
        <TouchableOpacity onPress={() => navigation.goBack()} style={iconBtn} activeOpacity={0.8}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.ink2} strokeWidth={2}>
            <Path d="M18 6L6 18M6 6l12 12" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        style={Platform.OS === 'web' ? { overflow: 'visible' } : undefined}
        contentContainerStyle={[
          { paddingBottom: scrollBottomPad, paddingHorizontal: 16 },
          Platform.OS === 'web' && { overflow: 'visible' as const },
        ]}
      >
        <View style={{ paddingBottom: 20 }}>
          <Mono color={W.coral}>// NEW PROTOCOL</Mono>
          <Text style={{ fontFamily: fonts.display, fontSize: 32, color: W.ink, marginTop: 10, letterSpacing: -0.5, lineHeight: 38 }}>
            {'Adicionar\nLocal'}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <View>
            <Mono style={{ marginBottom: 6 }}>Nome</Mono>
            <TextInput
              style={[fieldStyle, { color: W.ink }]}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do local"
              placeholderTextColor={W.ink4}
            />
          </View>

          <View
            style={{
              position: 'relative',
              zIndex: suggestions.length > 0 ? 100 : 1,
              ...(Platform.OS === 'android' ? { elevation: suggestions.length > 0 ? 16 : 0 } : {}),
            }}
          >
            <Mono style={{ marginBottom: 6 }}>Endereço</Mono>
            <View
              style={[
                fieldStyle,
                { flexDirection: 'row', alignItems: 'center', gap: 10 },
                addressFocused && styles.addressRowFocused,
              ]}
            >
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={W.ink3} strokeWidth={2}>
                <Circle cx={11} cy={11} r={7} />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
              <TextInput
                style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: W.ink, minWidth: 0 }}
                value={addressInput}
                onChangeText={onAddressChange}
                onFocus={() => setAddressFocused(true)}
                onBlur={() => setAddressFocused(false)}
                placeholder="Buscar endereço..."
                placeholderTextColor={W.ink4}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {loading ? <ActivityIndicator size="small" color={W.coral} /> : null}
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsSheet}>
                <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={{ maxHeight: 220 }}>
                  {suggestions.map(s => {
                    const sf = s.structured_formatting;
                    const title = sf?.main_text ?? s.description;
                    const sub = sf?.secondary_text;
                    return (
                      <TouchableOpacity
                        key={s.place_id}
                        style={styles.suggestionRow}
                        onPress={() => selectSuggestion(s)}
                        activeOpacity={0.75}
                      >
                        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: W.ink }} numberOfLines={1}>
                          {title}
                        </Text>
                        {!!sub && (
                          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: W.ink3, marginTop: 2 }} numberOfLines={2}>
                            {sub}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Coordenadas — sempre visível (paridade CadastroLocal / FormField location_searching) */}
          <View>
            <Mono style={{ marginBottom: 6 }}>Coordenadas</Mono>
            <View
              style={[
                fieldStyle,
                { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 12 },
              ]}
            >
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke={W.ink3}
                strokeWidth={2}
                strokeLinecap="round"
                pointerEvents="none"
              >
                <Circle cx={12} cy={12} r={3} />
                <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </Svg>
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: placeDetails ? W.ink : W.ink4,
                  minWidth: 0,
                  padding: 0,
                }}
                value={placeDetails ? `${placeDetails.lat}, ${placeDetails.lng}` : ''}
                placeholder="Aguardando seleção..."
                placeholderTextColor={W.ink4}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>

          <View style={{ gap: 12, zIndex: 0 }}>
            <Mono style={{ marginBottom: 2 }}>Tags</Mono>

            {tagsLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={W.ink3} />
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.ink3 }}>Carregando tags…</Text>
              </View>
            ) : null}

            {tagsLoadError ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.rose }}>
                Não foi possível carregar as tags. Você ainda pode usar + Nova.
              </Text>
            ) : null}

            {!tagsLoading && !tagsLoadError && allTags.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: W.ink3, lineHeight: 18 }}>
                Nenhuma tag cadastrada ainda. Crie uma com + Nova ou cadastre tags no sistema.
              </Text>
            ) : null}

            {!tagsLoading && !tagsLoadError && allTags.length > 0 ? (
              <View>
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    color: W.ink4,
                    marginBottom: 8,
                  }}
                >
                  Tags cadastradas
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderWidth: 1,
                    borderColor: W.lineSoft,
                  }}
                >
                  {allTags.map(apiTag => {
                    const baseColor = resolveTagHex(apiTag.cor);
                    const selected = selectedTags.some(t => t.id === apiTag.id);
                    return (
                      <TouchableOpacity
                        key={apiTag.id}
                        onPress={() => toggleRegisteredTag(apiTag)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? hexToRgba(baseColor, 0.45) : hexToRgba(baseColor, 0.22),
                          backgroundColor: selected ? hexToRgba(baseColor, 0.2) : 'rgba(255,255,255,0.02)',
                          paddingVertical: 7,
                          paddingHorizontal: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 99,
                            backgroundColor: baseColor,
                          }}
                        />
                        <Text style={{ fontSize: 12, fontFamily: fonts.bodySemiBold, color: W.ink }}>{apiTag.nome}</Text>
                        {selected ? (
                          <Svg
                            width={14}
                            height={14}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={baseColor}
                            strokeWidth={2.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pointerEvents="none"
                          >
                            <Path d="M5 13l4 4L19 7" />
                          </Svg>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {selectedTags.some(t => !t.id) ? (
              <View>
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    color: W.ink4,
                    marginBottom: 8,
                  }}
                >
                  Tags novas
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selectedTags.filter(t => !t.id).map(t => {
                    const baseColor = resolveTagHex(t.cor);
                    const key = `new-${(t.nome ?? '').trim().toLowerCase()}`;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => removeTag(t)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: hexToRgba(baseColor, 0.28),
                          backgroundColor: hexToRgba(baseColor, 0.16),
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                        }}
                      >
                        <View style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: baseColor }} />
                        <Text style={{ fontSize: 12, fontFamily: fonts.bodySemiBold, color: W.ink }}>{t.nome}</Text>
                        <View
                          style={{
                            marginLeft: 2,
                            width: 16,
                            height: 16,
                            borderRadius: 99,
                            backgroundColor: 'rgba(0,0,0,0.14)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 12, color: W.ink2, lineHeight: 14 }}>×</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setTagDraftOpen(v => !v)}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.18)',
                  backgroundColor: 'transparent',
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: fonts.bodySemiBold, color: W.ink3 }}>+ Nova</Text>
              </TouchableOpacity>
              {selectedTags.length > 0 ? (
                <Text style={{ fontSize: 11, fontFamily: fonts.body, color: W.ink3 }}>
                  {selectedTags.length} selecionada{selectedTags.length !== 1 ? 's' : ''}
                </Text>
              ) : null}
            </View>

            {tagDraftOpen ? (
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderWidth: 1,
                  borderColor: W.lineSoft,
                  borderRadius: 12,
                  padding: 14,
                  gap: 12,
                }}
              >
                <TextInput
                  style={[fieldStyle, { paddingVertical: 12, fontSize: 14, color: W.ink }]}
                  value={tagNameDraft}
                  onChangeText={setTagNameDraft}
                  placeholder="Nome da categoria..."
                  placeholderTextColor={W.ink4}
                  onSubmitEditing={addTagFromDraft}
                  returnKeyType="done"
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, flex: 1, alignItems: 'center' }}>
                    {TAG_PALETTE.map(p => {
                      const active = tagColorDraft.toLowerCase() === p.value.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={p.value}
                          onPress={() => setTagColorDraft(p.value)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 99,
                            backgroundColor: p.value,
                            borderWidth: active ? 2.5 : 1,
                            borderColor: active ? hexToRgba(p.value, 0.75) : 'rgba(255,255,255,0.12)',
                          }}
                          accessibilityLabel={p.name}
                        />
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    onPress={addTagFromDraft}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: hexToRgba(tagDraftUiColor, 0.28),
                      backgroundColor: hexToRgba(tagDraftUiColor, 0.14),
                      minHeight: 44,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: fonts.bodySemiBold, color: tagDraftUiColor }}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: submitBarBottom,
          left: 16,
          right: 16,
          transform: [{ translateY: tagDraftSubmitShift }],
        }}
      >
        <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          <LinearGradient
            colors={[W.coralSoft, W.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
          >
            {submitting
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: 'white', fontFamily: fonts.bodySemiBold, fontSize: 15 }}>Criar local</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addressRowFocused: {
    borderColor: W.coral,
    shadowColor: W.coralGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    backgroundColor: W.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W.line,
    zIndex: 50,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: W.lineSoft,
  },
});

const successModal = StyleSheet.create({
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
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    backgroundColor: W.bg3,
    borderWidth: 1,
    borderColor: W.line,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: W.ink,
    lineHeight: 28,
    marginBottom: 8,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: W.ink3,
    lineHeight: 20,
    marginBottom: 14,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  coordVal: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.aqua,
  },
  dash: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 20,
  },
  saved: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: W.violet,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  btnSecondary: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnSecondaryText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.ink3,
  },
  btnPrimary: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: W.coral,
  },
  btnPrimaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: 'white',
  },
});
