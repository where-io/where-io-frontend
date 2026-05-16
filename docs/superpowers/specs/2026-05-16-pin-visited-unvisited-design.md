# Design: Pins do Mapa — Visitado vs. A Visitar (Teardrop Clássico)

**Data:** 2026-05-16
**Arquivos modificados:**
- `mobile/src/service/LocaisService.ts`
- `mobile/src/components/LeafletMap.tsx`

---

## Problema

Os pins do mapa têm um único visual independente de o local ter sido visitado ou não. O designer definiu dois estados distintos no arquivo "Map Pins & App Icon.html" (Pin01 · Teardrop clássico).

---

## Fonte de dados

`/api/local/all` já retorna `visitas: VisitaDtoResponse[]` dentro de cada local. Nenhuma chamada extra à API é necessária.

---

## Solução

### 1. `LocaisService.ts` — enriquecer interface `Local`

Adicionar o campo:

```ts
visitas?: { id: string }[];
```

Tipo mínimo — apenas o necessário para derivar `visited = visitas.length > 0`. Campos adicionais do `VisitaDtoResponse` (data, avaliação, comentário) não são necessários aqui.

### 2. `LeafletMap.tsx` — `pinSvg(color, visited)`

A função `pinSvg` passa a aceitar um segundo parâmetro `visited` (boolean).

**Estado: Visitado** (`visited === true`)
- Gota sólida preenchida com a cor da tag
- Stroke branco semitransparente: `rgba(255,255,255,0.6)`, `strokeWidth="1"`
- Checkmark interno na cor de fundo `#0A1028`:
  - path: `M11 15.5l3.5 3.5L21 12.5`
  - `strokeWidth="2.6"`, `strokeLinecap="round"`, `strokeLinejoin="round"`

**Estado: A visitar** (`visited === false`)
- Gota escura translúcida: `fill="rgba(10,16,40,0.65)"`
- Stroke tracejado na cor da tag: `strokeWidth="1.6"`, `strokeDasharray="3 2.5"`
- Ponto central fantasma: `<circle cx="16" cy="16" r="2.5" fill={color} fillOpacity="0.55"/>`

Ambos os estados mantêm o mesmo `viewBox="0 0 32 42"` e tamanho `width="26" height="34"` (dimensões atuais do pin).

### 3. `LeafletMap.tsx` — `updateLocations()`

Derivar `visited` antes de criar o ícone:

```js
var visited = !!(loc.visitas && loc.visitas.length > 0);
var icon = L.divIcon({
  html: pinSvg(color, visited),
  iconSize: [26, 34],
  iconAnchor: [13, 34],
  className: '',
});
```

---

## O que NÃO muda

- Lógica de cor por tag (`pinColorForLocal`) — inalterada
- Tamanho e âncora dos pins — inalterados
- `ScreenMap.tsx` — nenhuma alteração
- Qualquer outra tela ou componente
