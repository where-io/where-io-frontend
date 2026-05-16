import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Mono } from '../components/Typography';
import { W, fonts } from '../tokens';
import { create, update, Visita } from '../service/VisitaService';

function toInputDate(dataVisita: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(dataVisita)) return dataVisita.slice(0, 10);
  const d = new Date(dataVisita);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function ScreenRegistrarVisita() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<any>();
  const localId: string = route.params?.localId;
  const visita: Visita | undefined = route.params?.visita;
  const isEdit = !!visita?.id;

  const [dataVisita, setDataVisita] = useState(
    visita?.dataVisita ? toInputDate(visita.dataVisita) : new Date().toISOString().slice(0, 10),
  );
  const [avaliacao, setAvaliacao] = useState(visita?.avaliacao ?? 0);
  const [comentario, setComentario] = useState(visita?.comentario ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!avaliacao) { Alert.alert('Atenção', 'Selecione uma avaliação.'); return; }
    if (!dataVisita.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Atenção', 'Data inválida. Use o formato AAAA-MM-DD.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        idLocal: localId,
        dataVisita,
        avaliacao,
        comentario: comentario.trim() || undefined,
      };

      const ok = isEdit
        ? await update(visita!.id, payload)
        : (await create(payload)) != null;

      if (ok) {
        navigation.navigate({
          name: 'Detail',
          params: { visitasRefreshKey: Date.now() },
          merge: true,
        });
        navigation.goBack();
      } else {
        Alert.alert('Erro', isEdit
          ? 'Não foi possível atualizar a visita. Tente novamente.'
          : 'Não foi possível registrar a visita. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: W.bg0, paddingTop: insets.top }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: W.bg2, borderWidth: 1, borderColor: W.line, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.8}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={W.ink2} strokeWidth={2}>
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
          </TouchableOpacity>
          <Mono>{isEdit ? 'Editar visita' : 'Registrar visita'}</Mono>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 28 }}>
            <Mono color={W.coral} style={{ marginBottom: 6 }}>
              {isEdit ? '// ATUALIZAR REGISTRO' : '// NOVA VISITA'}
            </Mono>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: W.ink, letterSpacing: -0.4 }}>
              {isEdit ? 'Ajustar visita' : 'Como foi?'}
            </Text>
          </View>

          <View style={{ gap: 20 }}>
            <View>
              <Mono style={{ marginBottom: 12 }}>Avaliação</Mono>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setAvaliacao(star)} activeOpacity={0.8}>
                    <Text style={{ fontSize: 40, color: star <= avaliacao ? W.amber : W.bg4 }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {avaliacao > 0 && (
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: W.ink3, textAlign: 'center', marginTop: 8, letterSpacing: 1.2 }}>
                  {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][avaliacao]}
                </Text>
              )}
            </View>

            <View>
              <Mono style={{ marginBottom: 6 }}>Data da visita</Mono>
              <TextInput
                style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.mono, fontSize: 14, color: W.ink }}
                value={dataVisita}
                onChangeText={setDataVisita}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={W.ink4}
                keyboardType="numeric"
              />
            </View>

            <View>
              <Mono style={{ marginBottom: 6 }}>Comentário (opcional)</Mono>
              <TextInput
                style={{ backgroundColor: W.bg2, borderWidth: 1, borderColor: W.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, color: W.ink, height: 100, textAlignVertical: 'top' }}
                value={comentario}
                onChangeText={setComentario}
                placeholder="Como foi a visita? Anote o que quiser..."
                placeholderTextColor={W.ink4}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>

        <View style={{ position: 'absolute', bottom: Math.max(insets.bottom + 10, 28), left: 16, right: 16 }}>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            <LinearGradient
              colors={[W.coralSoft, W.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
            >
              {submitting
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontFamily: fonts.bodySemiBold, fontSize: 15 }}>
                    {isEdit ? 'Salvar alterações' : 'Salvar Visita'}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
