import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Mono } from './Typography';
import { W, fonts } from '../tokens';
import { Tag, associateTag, dissociateTag, getTags } from '../service/LocaisService';
import * as TagService from '../service/TagService';
import { TAG_PALETTE, hexToRgba, resolveTagHex } from '../service/tagColors';

interface Props {
  localId: string;
  onTagsChange?: (tags: Tag[]) => void;
}

function LabelIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} pointerEvents="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <Path d="M7 7h.01" />
    </Svg>
  );
}

function TagChip({
  tag,
  busy,
  onEdit,
  onRemove,
}: {
  tag: Tag;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const color = resolveTagHex(tag.cor);
  return (
    <Pressable
      onLongPress={busy ? undefined : onEdit}
      delayLongPress={400}
      accessibilityLabel={`Tag ${tag.nome}. Segure para editar.`}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.18),
          opacity: busy ? 0.65 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <LabelIcon color={color} />
      <Text style={[styles.chipLabel, { color }]} numberOfLines={1}>
        {tag.nome || 'Tag'}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        disabled={busy || !tag.id}
        style={styles.chipRemoveBtn}
        activeOpacity={0.75}
        accessibilityLabel={`Remover tag ${tag.nome}`}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
      >
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={W.coral} strokeWidth={2.2} pointerEvents="none">
          <Path d="M18 6L6 18M6 6l12 12" />
        </Svg>
      </TouchableOpacity>
    </Pressable>
  );
}

function ColorPalette({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <View style={styles.palette}>
      {TAG_PALETTE.map(p => {
        const active = value.toLowerCase() === p.value.toLowerCase();
        return (
          <TouchableOpacity
            key={p.value}
            onPress={() => onChange(p.value)}
            style={[
              styles.swatch,
              { backgroundColor: p.value },
              active && { borderColor: hexToRgba(p.value, 0.85), borderWidth: 2 },
            ]}
            accessibilityLabel={p.name}
          />
        );
      })}
    </View>
  );
}

export function LocalTagsManager({ localId, onTagsChange }: Props) {
  const [localTags, setLocalTags] = useState<Tag[]>([]);
  const [catalog, setCatalog] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutationBusy, setMutationBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);

  const [draftNome, setDraftNome] = useState('');
  const [draftCor, setDraftCor] = useState<string>(TAG_PALETTE[0].value);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const refreshLocalTags = useCallback(async () => {
    const tags = await getTags(localId);
    setLocalTags(tags);
    onTagsChange?.(tags);
    return tags;
  }, [localId, onTagsChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const tags = await getTags(localId);
      if (!cancelled) {
        setLocalTags(tags);
        onTagsChange?.(tags);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [localId, onTagsChange]);

  const availableToAdd = useMemo(
    () => catalog.filter(t => t.id && !localTags.some(lt => lt.id === t.id)),
    [catalog, localTags],
  );

  async function openAddSheet() {
    setDraftNome('');
    setDraftCor(TAG_PALETTE[0].value);
    setAddOpen(true);
    setCatalogLoading(true);
    const list = await TagService.getAll();
    setCatalog(list);
    setCatalogLoading(false);
  }

  async function handleAssociate(tag: Tag) {
    if (!tag.id || mutationBusy) return;
    setMutationBusy(true);
    try {
      const ok = await associateTag(localId, tag.id);
      if (ok) {
        await refreshLocalTags();
        setAddOpen(false);
      } else {
        Alert.alert('Erro', 'Não foi possível associar a tag.');
      }
    } finally {
      setMutationBusy(false);
    }
  }

  async function handleCreateAndAssociate() {
    const nome = draftNome.trim();
    if (!nome || mutationBusy) return;
    setMutationBusy(true);
    try {
      const id = await TagService.create({ nome, cor: resolveTagHex(draftCor) });
      if (!id) {
        Alert.alert('Erro', 'Não foi possível criar a tag.');
        return;
      }
      const ok = await associateTag(localId, id);
      if (ok) {
        await refreshLocalTags();
        setAddOpen(false);
        setDraftNome('');
      } else {
        Alert.alert('Erro', 'Tag criada, mas não foi possível associar ao local.');
      }
    } finally {
      setMutationBusy(false);
    }
  }

  async function handleDissociate(tag: Tag) {
    if (!tag.id || mutationBusy) return;
    setMutationBusy(true);
    try {
      const ok = await dissociateTag(localId, tag.id);
      if (ok) await refreshLocalTags();
      else Alert.alert('Erro', 'Não foi possível remover a tag deste local.');
    } finally {
      setMutationBusy(false);
    }
  }

  function openEdit(tag: Tag) {
    setEditTag(tag);
    setDraftNome(tag.nome ?? '');
    setDraftCor(resolveTagHex(tag.cor));
  }

  async function handleSaveEdit() {
    if (!editTag?.id || mutationBusy) return;
    const nome = draftNome.trim();
    if (!nome) return;
    setMutationBusy(true);
    try {
      const ok = await TagService.update(editTag.id, { nome, cor: resolveTagHex(draftCor) });
      if (ok) {
        await refreshLocalTags();
        setEditTag(null);
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a tag.');
      }
    } finally {
      setMutationBusy(false);
    }
  }

  function confirmDeleteTag(tag: Tag) {
    if (!tag.id) return;
    Alert.alert(
      'Excluir tag',
      `A tag "${tag.nome}" será removida da sua conta e de todos os locais. Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setMutationBusy(true);
            try {
              await dissociateTag(localId, tag.id!);
              const ok = await TagService.remove(tag.id!);
              if (ok) {
                await refreshLocalTags();
                setEditTag(null);
              } else {
                Alert.alert('Erro', 'Não foi possível excluir a tag.');
              }
            } finally {
              setMutationBusy(false);
            }
          },
        },
      ],
    );
  }

  const tagsSummary = useMemo(() => {
    if (localTags.length === 0) return 'Tags: nenhuma associada';
    const names = localTags.map(t => t.nome).filter(Boolean);
    if (names.length === 0) return `Tags: ${localTags.length} tag(s)`;
    const joined = names.join(' · ');
    return joined.length > 48 ? `Tags: ${joined.slice(0, 46)}…` : `Tags: ${joined}`;
  }, [localTags]);

  return (
    <View style={styles.strip} accessibilityLabel={tagsSummary}>
      {loading ? (
        <ActivityIndicator color={W.coral} size="small" />
      ) : (
        <>
          {localTags.length === 0 ? (
            <Text style={styles.empty}>Nenhuma tag associada.</Text>
          ) : (
            localTags.map(tag => (
              <TagChip
                key={tag.id ?? tag.nome}
                tag={tag}
                busy={mutationBusy}
                onEdit={() => openEdit(tag)}
                onRemove={() => handleDissociate(tag)}
              />
            ))
          )}
          <TouchableOpacity
            onPress={openAddSheet}
            disabled={mutationBusy}
            style={[styles.addBtn, mutationBusy && { opacity: 0.45 }]}
            activeOpacity={0.8}
            accessibilityLabel="Adicionar tag"
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.coral} strokeWidth={2.5} pointerEvents="none">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </TouchableOpacity>
        </>
      )}

      {/* Adicionar */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => !mutationBusy && setAddOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => !mutationBusy && setAddOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Mono size={11} style={styles.modalKicker}>// TAGS</Mono>
            <Text style={styles.modalTitle}>Adicionar tag</Text>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {catalogLoading ? (
                <ActivityIndicator color={W.coral} style={{ marginVertical: 16 }} />
              ) : availableToAdd.length > 0 ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Suas tags</Text>
                  <View style={styles.catalogList}>
                    {availableToAdd.map(tag => {
                      const color = resolveTagHex(tag.cor);
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          onPress={() => handleAssociate(tag)}
                          disabled={mutationBusy}
                          style={[styles.catalogRow, { borderColor: hexToRgba(color, 0.25) }]}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.chipDot, { backgroundColor: color }]} />
                          <Text style={[styles.catalogRowText, { color }]}>{tag.nome}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : !catalogLoading && catalog.length > 0 ? (
                <Text style={styles.hint}>Todas as suas tags já estão neste local.</Text>
              ) : null}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Criar nova</Text>
                <TextInput
                  value={draftNome}
                  onChangeText={setDraftNome}
                  placeholder="Nome da tag"
                  placeholderTextColor={W.ink4}
                  style={styles.input}
                  editable={!mutationBusy}
                  returnKeyType="done"
                />
                <ColorPalette value={draftCor} onChange={setDraftCor} />
                <TouchableOpacity
                  onPress={handleCreateAndAssociate}
                  disabled={mutationBusy || !draftNome.trim()}
                  style={[styles.primaryBtn, (!draftNome.trim() || mutationBusy) && { opacity: 0.45 }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {mutationBusy ? 'Salvando…' : 'Criar e associar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setAddOpen(false)}
              disabled={mutationBusy}
              style={styles.ghostBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Editar */}
      <Modal visible={!!editTag} transparent animationType="slide" onRequestClose={() => !mutationBusy && setEditTag(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => !mutationBusy && setEditTag(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Mono size={11} style={styles.modalKicker}>// EDITAR</Mono>
            <Text style={styles.modalTitle}>Editar tag</Text>

            <TextInput
              value={draftNome}
              onChangeText={setDraftNome}
              placeholder="Nome da tag"
              placeholderTextColor={W.ink4}
              style={styles.input}
              editable={!mutationBusy}
            />
            <ColorPalette value={draftCor} onChange={setDraftCor} />

            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={mutationBusy || !draftNome.trim()}
              style={[styles.primaryBtn, { marginTop: 14 }, (!draftNome.trim() || mutationBusy) && { opacity: 0.45 }]}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{mutationBusy ? 'Salvando…' : 'Salvar alterações'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => editTag && handleDissociate(editTag).then(() => setEditTag(null))}
              disabled={mutationBusy}
              style={styles.secondaryBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Remover deste local</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => editTag && confirmDeleteTag(editTag)}
              disabled={mutationBusy}
              style={styles.dangerBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.dangerBtnText}>Excluir tag da conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditTag(null)}
              disabled={mutationBusy}
              style={styles.ghostBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: W.ink3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 11,
    paddingRight: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 1,
    maxWidth: 160,
  },
  chipRemoveBtn: {
    width: 22,
    height: 22,
    marginLeft: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    flexShrink: 0,
  },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,94,0.45)',
    backgroundColor: 'rgba(255,107,94,0.1)',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,10,22,0.72)',
  },
  modalSheet: {
    backgroundColor: W.bg3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: W.line,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '78%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: W.bg4,
    marginBottom: 14,
  },
  modalKicker: {
    letterSpacing: 1.4,
    color: W.coral,
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: W.ink,
    marginBottom: 14,
  },
  modalScroll: {
    maxHeight: 340,
  },
  modalSection: {
    marginBottom: 18,
    gap: 10,
  },
  modalSectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: W.ink4,
  },
  catalogList: {
    gap: 8,
  },
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  catalogRowText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: W.ink3,
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: W.ink,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: W.line,
    backgroundColor: W.bg2,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  primaryBtn: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(94,224,200,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(94,224,200,0.35)',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: W.aqua,
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: W.line,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: W.ink2,
  },
  dangerBtn: {
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,94,0.1)',
    alignItems: 'center',
  },
  dangerBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: W.coral,
  },
  ghostBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: W.ink3,
  },
});
