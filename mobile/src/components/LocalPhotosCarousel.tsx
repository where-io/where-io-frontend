import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Mono } from './Typography';
import { W, fonts } from '../tokens';
import {
  listLocalFotos,
  uploadFile,
  deleteLocalFoto,
  FotoResponse,
} from '../service/LocaisService';
import { API_URL } from '../service/config';

function buildImageSrc(item: FotoResponse): string {
  const path = item?.urlPath || (item?.fileName ? `/media/${item.fileName}` : '');
  if (!path) return '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('http')) return normalized;
  return `${API_URL}${normalized}`;
}

const stripHeight = Math.min(Math.round(Dimensions.get('window').height * 0.27), 220);
const FRAME_RADIUS = 10;

interface Props {
  localId: string;
  onPhotosChanged?: () => void;
}

export function LocalPhotosCarousel({ localId, onPhotosChanged }: Props) {
  const [items, setItems] = useState<FotoResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!localId) {
      setItems([]);
      setIndex(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listLocalFotos(localId);
      setItems(Array.isArray(data) ? data : []);
      setIndex(0);
    } catch {
      setItems([]);
      setError('Não foi possível carregar as fotos.');
    } finally {
      setLoading(false);
    }
  }, [localId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    setIndex(i => {
      const n = items.length;
      if (n === 0) return 0;
      return Math.min(i, n - 1);
    });
  }, [items.length]);

  const count = items.length;
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const current = count > 0 ? items[safeIndex] : null;
  const src = current ? buildImageSrc(current) : '';
  const busy = uploadBusy || deleteBusy;

  const goPrev = () => {
    if (count <= 1) return;
    setIndex(i => (i - 1 + count) % count);
  };

  const goNext = () => {
    if (count <= 1) return;
    setIndex(i => (i + 1) % count);
  };

  async function handleAttach() {
    if (!localId || busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.92,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadBusy(true);
    setError(null);
    try {
      const asset = result.assets[0];
      const uploaded = await uploadFile(asset.uri, localId, {
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      if (!uploaded) {
        setError('Falha ao enviar a foto. Tente novamente.');
        return;
      }
      await load();
      onPhotosChanged?.();
    } catch {
      setError('Falha ao enviar a foto. Tente novamente.');
    } finally {
      setUploadBusy(false);
    }
  }

  async function confirmDelete() {
    if (!current?.fileName || deleteBusy) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const ok = await deleteLocalFoto(localId, current.fileName);
      if (!ok) {
        setError('Não foi possível remover a foto.');
        return;
      }
      setConfirmDeleteOpen(false);
      await load();
      onPhotosChanged?.();
    } catch {
      setError('Não foi possível remover a foto.');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!localId) return null;

  return (
    <View style={styles.card}>
      <Modal
        visible={confirmDeleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteBusy && setConfirmDeleteOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, styles.modalBackdrop]}
            onPress={() => !deleteBusy && setConfirmDeleteOpen(false)}
            accessibilityLabel="Fechar"
          />
          <View style={styles.modalSheet} accessibilityViewIsModal>
            <Mono size={11} style={{ letterSpacing: 1.4, marginBottom: 8 }}>Excluir foto</Mono>
            <Text style={styles.modalMessage}>
              Remover esta foto do local? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnGhost}
                onPress={() => setConfirmDeleteOpen(false)}
                disabled={deleteBusy}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnDanger}
                onPress={confirmDelete}
                disabled={deleteBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnDangerText}>
                  {deleteBusy ? 'Removendo…' : 'Remover'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Mono size={9} style={{ letterSpacing: 1.8 }}>Fotos</Mono>
          {count > 0 && !loading ? (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{count}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={handleAttach}
          disabled={busy}
          activeOpacity={0.8}
          style={[styles.attachBtn, busy && { opacity: 0.5 }]}
          accessibilityLabel="Anexar foto"
        >
          {uploadBusy ? (
            <ActivityIndicator size="small" color={W.coral} />
          ) : (
            <>
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke={W.coral}
                strokeWidth={2}
                strokeLinecap="round"
                pointerEvents="none"
              >
                <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </Svg>
              <Text style={styles.attachBtnLabel}>Anexar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.viewport, { height: stripHeight, minHeight: stripHeight }]}>
        {loading ? (
          <View style={styles.viewportInner}>
            <ActivityIndicator color={W.ink3} />
            <Text style={styles.hintMono}>Carregando…</Text>
          </View>
        ) : count === 0 ? (
          <View style={styles.emptyZone}>
            <View style={styles.emptyIconWrap}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={W.ink3} strokeWidth={1.6} pointerEvents="none">
                <Rect x={3} y={3} width={18} height={18} rx={3} />
                <Circle cx={8.5} cy={8.5} r={1.5} fill={W.ink3} stroke="none" />
                <Path d="M21 15l-5-5L5 21" />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
            <Text style={styles.emptyHint}>
              Registre momentos deste local. Use o botão abaixo ou o anexo no canto.
            </Text>
            <TouchableOpacity
              onPress={handleAttach}
              disabled={busy}
              activeOpacity={0.85}
              style={[styles.emptyCta, busy && { opacity: 0.55 }]}
            >
              <Text style={styles.emptyCtaText}>Adicionar foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.imageStage}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setConfirmDeleteOpen(true)}
                disabled={busy}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Remover foto"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={W.ink} strokeWidth={2.2} pointerEvents="none">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
              <Image source={{ uri: src }} style={styles.image} resizeMode="contain" />
            </View>

            {count > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navBtn, styles.navLeft]}
                  onPress={goPrev}
                  accessibilityLabel="Foto anterior"
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={W.ink} strokeWidth={2.4} pointerEvents="none">
                    <Path d="M15 18l-6-6 6-6" />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navBtn, styles.navRight]}
                  onPress={goNext}
                  accessibilityLabel="Próxima foto"
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={W.ink} strokeWidth={2.4} pointerEvents="none">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {count > 0 && !loading ? (
        <View style={styles.footer}>
          <Text style={styles.counter}>
            {safeIndex + 1} / {count}
          </Text>
          {count > 1 ? (
            <View style={styles.dots}>
              {items.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setIndex(i)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  accessibilityLabel={`Foto ${i + 1}`}
                >
                  <View style={[styles.dot, i === safeIndex ? styles.dotActive : styles.dotIdle]} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
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
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  countChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(94,224,200,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94,224,200,0.28)',
  },
  countChipText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: W.aqua,
    letterSpacing: 0.6,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,94,0.22)',
    backgroundColor: 'rgba(255,107,94,0.08)',
  },
  attachBtnLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: W.coral,
  },
  viewport: {
    position: 'relative',
    width: '100%',
    borderRadius: FRAME_RADIUS,
    overflow: 'hidden',
  },
  viewportInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: FRAME_RADIUS,
    gap: 10,
  },
  hintMono: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.ink3,
  },
  emptyZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: FRAME_RADIUS,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: W.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: W.ink2,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: W.ink3,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 6,
  },
  emptyCta: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,94,0.28)',
  },
  emptyCtaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: W.coral,
  },
  imageStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: FRAME_RADIUS,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 3,
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: FRAME_RADIUS,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLeft: { left: 10 },
  navRight: { right: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  counter: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: W.ink3,
    letterSpacing: 1,
    minWidth: 48,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dot: {
    height: 5,
    borderRadius: 999,
  },
  dotActive: {
    width: 10,
    backgroundColor: W.coral,
  },
  dotIdle: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  errorBanner: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,94,0.2)',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: W.coral,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(8,10,22,0.72)',
    zIndex: 0,
  },
  modalSheet: {
    zIndex: 2,
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    padding: 18,
    backgroundColor: W.bg3,
    borderWidth: 1,
    borderColor: W.line,
  },
  modalMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: W.ink2,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalBtnGhostText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.ink3,
  },
  modalBtnDanger: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,94,0.22)',
  },
  modalBtnDangerText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.coral,
    fontWeight: '600',
  },
});
