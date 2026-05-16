# Design: Botão de Centralizar no Usuário (Header do Mapa)

**Data:** 2026-05-16  
**Arquivo principal:** `mobile/src/screens/ScreenMap.tsx`  
**Arquivo secundário:** `mobile/src/components/LeafletMap.tsx`

---

## Problema

O header superior do mapa tem um botão "+" que navega para a tela de criar local. O usuário quer substituí-lo por um botão de localização que centraliza o mapa na posição atual do usuário.

---

## Solução

### 1. Ícone

Ícone SVG de **alvo/target** (◎): círculo externo + círculo interno menor, estilo "me localizar". Mesmo container visual do botão atual: `32×32`, `borderRadius: 10`, `bg: W.bg3`, `borderColor: W.line`, stroke `W.ink2`.

Quando GPS indisponível (`userLocation === null`): botão renderiza com `opacity: 0.3` e sem `onPress` (sem feedback ao toque).

### 2. Mecanismo de trigger — `centerOnUserTrigger`

Adiciona `centerOnUserCount: number` (state, inicia em `0`) em `ScreenMap`. A cada pressão do botão, incrementa com `setCenterOnUserCount(c => c + 1)`.

Passa `centerOnUserTrigger={centerOnUserCount}` como nova prop para `LeafletMap`.

### 3. Efeito no `LeafletMap`

Nova prop `centerOnUserTrigger?: number` na interface `Props`.

Novo `useEffect` que depende de `[centerOnUserTrigger]`:
- Ignora quando `centerOnUserTrigger` é `0` ou `undefined` (evita voo no mount)
- Lê `userLocationRef.current` (sempre atualizado pela subscription de GPS)
- Se localização disponível: injeta `flyToLocation(lat, lng)` no WebView — mesmo voo animado já usado para pins (1.5s, zoom 16)
- Se não disponível: no-op (o botão já está desabilitado na UI, mas a guard aqui é segura)

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `ScreenMap.tsx` | Adiciona state `centerOnUserCount`; substitui botão "+"; passa nova prop |
| `LeafletMap.tsx` | Adiciona prop `centerOnUserTrigger`; adiciona `useEffect` de centralização |

---

## O que NÃO muda

- O botão "+" de criar local **não** é readicionado em outro lugar (remoção definitiva do header)
- O fluxo de GPS existente (watch, userLocation state, userMarker no mapa) não é alterado
- A função `flyToLocation` no HTML do LeafletMap não é alterada
