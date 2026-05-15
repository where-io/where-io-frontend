# UPDATE — Redesign Gráfico WHERE·io

Data: 2026-05-01  
Branch: v2

## Objetivo

Aplicar o novo sistema de design (arquivo de referência `index.html`) a todos os componentes React do projeto, sem alterar nenhuma lógica de negócio, estado, chamadas de API ou fluxo de dados.

---

## Design System Adotado

### Paleta de cores (CSS custom properties em `src/index.css`)

| Token          | Valor                        | Uso                         |
|----------------|------------------------------|-----------------------------|
| `--bg-0`       | `#0A1028`                    | Fundo global                |
| `--bg-1`       | `#0E1530`                    | Sidebar / painel lateral    |
| `--bg-2`       | `#141B36`                    | Modal / card flutuante      |
| `--bg-3`       | `#1B2244`                    | Painel aside do modal       |
| `--bg-4`       | `#242C55`                    | Inputs / controles          |
| `--line`       | `#2A3360`                    | Bordas                      |
| `--line-soft`  | `rgba(255,255,255,0.06)`     | Divisores suaves            |
| `--ink`        | `#F2F4FF`                    | Texto primário              |
| `--ink-2`      | `#B8BEDC`                    | Texto secundário            |
| `--ink-3`      | `#6E7699`                    | Texto terciário / labels    |
| `--ink-4`      | `#4A5176`                    | Texto desabilitado          |
| `--coral`      | `#FF6B5E`                    | Acento principal            |
| `--coral-soft` | `#FF8674`                    | Gradiente coral claro       |
| `--coral-glow` | `rgba(255,107,94,0.35)`      | Sombra coral                |
| `--aqua`       | `#5EE0C8`                    | Status / verificação        |
| `--amber`      | `#F2B95C`                    | Categoria "Quero ir"        |
| `--violet`     | `#8C7BFF`                    | Categoria casas             |
| `--rose`       | `#FF6B9D`                    | Categoria restaurantes      |
| `--sky`        | `#5EB7FF`                    | Privacidade / social        |

### Tipografia

- **Space Grotesk 700** — marca (`WHERE·io`), títulos de modal, `h2`/`h3`
- **JetBrains Mono 400/500** — labels de campo, badges, eyebrows, coordenadas, código
- **Inter 400–700** — corpo de texto, parágrafos, botões

---

## Arquivos Modificados

### `public/index.html`
- Adicionadas fontes **Space Grotesk**, **JetBrains Mono** e **Inter** via Google Fonts
- Mantida a fonte **Manrope** para compatibilidade com eventuais componentes legados
- Adicionado `preconnect` para melhor performance de carregamento

### `src/index.css`
- **Novo:** todas as CSS custom properties do design system (`--bg-0` a `--sky`)
- **Novo:** animação `pulse-dot` para o dot de status ao vivo
- **Novo:** classes utilitárias `.sidebar-scroll` e `.scrollbar-hide` para scrollbars personalizados
- Atualizado: `html, body` passam a usar `background: var(--bg-0)`, `color: var(--ink)`, `font-family: 'Inter'` e `overflow: hidden`

### `src/components/navlink/NavLink.jsx`
- **Antes:** mix de classes Tailwind hardcoded em tons de vermelho/cinza com ícones Material Symbols
- **Depois:** estilos inline com CSS variables; estado `active` usa gradiente coral com `box-shadow` glow; hover com opacidade sutil; suporte ao novo prop `badge` (para exibir atalhos como `⌘K`)

### `src/components/navlink/Form/FormSign.jsx`
- **Antes:** `position: absolute`, z-index padrão, sem blur de fundo
- **Depois:** `position: fixed`, `background: rgba(8,12,28,0.55)`, `backdrop-filter: blur(3px)`, `z-index: 90` — cobre todo o viewport incluindo a sidebar

### `src/components/navlink/Form/FormField.jsx`
- **Antes:** label com Tailwind, tracking e cor hardcoded em azul-cinza
- **Depois:** label em **JetBrains Mono**, `var(--ink-3)`, `letter-spacing: 0.14em`, `text-transform: uppercase`; ícone posicionado com `var(--ink-3)`

### `src/features/button/RedButton.jsx`
- **Antes:** botão sólido vermelho com ícone Material Symbols via prop `symbol`
- **Depois:** gradiente coral `linear-gradient(180deg, var(--coral-soft), var(--coral))`, `border-radius: 12px`, `box-shadow` glow coral, SVG inline `+`, efeito `translateY(-1px)` no hover; prop `symbol` removida (SVG embutido)

### `src/features/button/LightRedButton.jsx`
- **Antes:** gradiente pink/vermelho, border-radius quadrado, cor de texto `#680011`
- **Depois:** mesmo gradiente coral do design, `border-radius: 999px` (pill), texto branco, `box-shadow` glow, seta SVG inline à direita

### `src/features/button/TextOnlyButton.jsx`
- **Antes:** texto colorido com opacidade, sem borda
- **Depois:** estilo `btn-ghost` — fundo transparente, borda `var(--line)`, `border-radius: 999px`, `color: var(--ink-2)`

### `src/features/grid/LocationInfoCard.jsx`
- **Antes:** card `bg-white/5`, border `border-white/5`, texto branco
- **Depois:** `background: var(--bg-4)`, `border-radius: 10px`; label em **JetBrains Mono** 9px uppercase; valor em **JetBrains Mono** 14px `var(--ink)`

### `src/features/grid/LightRedInfoCard.jsx`
- **Antes:** card vermelho escuro com título e barra de progresso
- **Depois:** card com `rgba(255,107,94,0.06)` de fundo e borda coral suave; data em **JetBrains Mono**; estrelas em `var(--coral)` sobre fundo `var(--ink-4)`; texto do comentário em `var(--ink-2)`

### `src/features/sidebar/SideBar.jsx`
- **Antes:** `w-64 bg-[#101225]`, ícones Material Symbols, `hidden md:flex`, logo texto simples, botão vermelho sólido
- **Depois:**
  - `width: 256px`, `background: var(--bg-1)`, `border-right: 1px solid var(--line)`
  - Marca **WHERE·io** em **Space Grotesk** 22px com ponto coral; subtítulo `// navigation system` em **JetBrains Mono** com letra-espaçamento amplo
  - Seção `// quick` com label JetBrains Mono separando grupos de navegação
  - Botão "Adicionar Local" com `RedButton` redesenhado
  - Footer com navLinks `settings` e `help` sem destaque

### `src/features/sidebar/CollectionSidebar.jsx`
- **Antes:** painel lateral de altura total, `fixed left-0 top-0 bottom-0 ml-60`, que deslizava da esquerda; filtros com texto de ficção científica; items com miniaturas de imagem
- **Depois:** painel flutuante `position: fixed, top: 18px, left: 274px, width: 320px` com `border-radius: 16px`, `box-shadow: 0 30px 60px rgba(0,0,0,0.4)`; transição via `opacity` + `scale`; filtros brasileiros (`Todos`, `Casas`, `Restaurantes`, `Quero ir`); header com ícone bookmark coral, contador e botão fechar; campo de busca estilizado; items com ícone de mapa circular; footer com botão "New list" coral e label de ordenação

### `src/features/sidebar/LocationSidebar.jsx`
- **Antes:** fundo `#101225`, `pt-20` desnecessário, `backdrop-blur-3xl`, componentes separados `LocationHero`, `InfoGrid`, `RouteButton`, `ActiveExplorers`
- **Depois:**
  - `background: var(--bg-1)`, `border-left: 1px solid var(--line)`, sem padding-top excessivo
  - Hero de imagem com badge "Live Status" em `var(--aqua)` e título em **Space Grotesk**
  - Coordenadas via `LocationInfoCard` redesenhado
  - Seção "Visitas" com título em **Space Grotesk** e ícone SVG coral
  - Botão de rota no footer com estilo consistente
  - Removed: componentes não utilizados (`ActiveExplorers`, `ExplorerAvatar`); mock de dados `LOCATION_DATA` simplificado

### `src/features/cadastroLocal/CadastroLocal.jsx`
- **Antes:** modal `max-w-2xl`, painel esquerdo `bg-[#1c1e32]/40`, painel direito `bg-[#3b3d55]`, inputs escuros com texto rosa, layout flex row simples
- **Depois:**
  - Modal `width: 860px` com `border-radius: 16px`, `background: var(--bg-2)`, borda `var(--line)`
  - **Painel aside** (38%): `background: var(--bg-3)`; eyebrow `// new protocol` em JetBrains Mono coral; título "Create Location" em Space Grotesk 32px; footnote com ícone de escudo aqua
  - **Painel body** (62%): inputs com `background: var(--bg-4)`, foco com borda coral + `box-shadow`; sugestões do Google com novo estilo escuro
  - Inputs agora são componentes internos `StyledInput` / `StyledTextarea` com estado de foco controlado
  - Botões inlineados com mesmo estilo do design system (ghost + primary pill)
  - Botão de fechar `×` posicionado absolutamente no canto superior direito

### `src/features/cadastroVisita/CadastroVisita.jsx`
- **Antes:** mesmo layout do CadastroLocal antigo
- **Depois:** mesmo padrão do CadastroLocal novo:
  - Painel aside com eyebrow `// visita`, título "Registrar Visita"
  - Estrelas de avaliação em `var(--coral)` com `WebkitTextStroke` para estrelas vazias
  - Textarea e date input com foco coral
  - Imports não utilizados removidos (`useEffect`, `useRef`, `useCallback`)

---

## O que NÃO foi alterado

- `src/features/mapa/Mapa.jsx` — mapa Leaflet intacto
- `src/features/mapa/MapContext.jsx` — contexto de ações do mapa intacto
- `src/features/mapa/Mapa.css` — estilos do mapa intactos
- `src/features/cadastroLocal/search-component/SearchControl.jsx` — componente de busca intacto
- `src/pages/Home.jsx` — toda a lógica de estado, callbacks e chamadas de API intacta
- `src/routes/AppRouter.jsx` — roteamento intacto
- `src/service/LocaisService.js` — service intacto
- `src/service/VisitaService.js` — service intacto
- Toda a lógica de `useGooglePlaces`, `parseEndereco`, `flyTo`, `fetchVisitas`, `fetchLocations`

---

## Compatibilidade

- Nenhuma prop existente foi removida ou renomeada nas interfaces públicas dos componentes
- A prop `symbol` do `RedButton` foi removida (não era usada externamente — apenas em `SideBar.jsx` que foi atualizado junto)
- O `label` prop do `RedButton` original não era utilizado no componente — removido sem impacto
