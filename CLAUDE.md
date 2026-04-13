# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A personal blog built with **Zola** (Rust-based static site generator), despite the directory name suggesting Jekyll. Content is primarily Portuguese (PT-BR). It deploys to GitHub Pages via GitHub Actions.

## Commands

```bash
# Dev: Tailwind em watch mode + Zola serve (http://127.0.0.1:1111/)
npm run dev

# Build de produção: compila Tailwind (minificado) + zola build
npm run build

# Apenas recompilar o CSS (ex: após editar assets/css/input.css ou templates)
npm run css:build

# Deploy manual: npm run build + git commit + git push
./deploy.sh
```

> **`static/css/style.css` não é commitado** — é gerado automaticamente pelo CI e localmente via `npm run css:build`. Nunca commite este arquivo.

No test suite exists. The CI pipeline (`.github/workflows/static.yml`) runs on every push to `main` and executes, in order: `npm install` → `npm run css:build` → `zola build` → deploy.

## Architecture

**Zola version:** 0.14.0 (pinned in GitHub Actions — newer versions may have breaking changes)

**Output directory:** `docs/` — committed to git and served by GitHub Pages from that folder.

### CSS Pipeline (Tailwind)

CSS is compiled **outside of Zola** via the Tailwind CLI:

```
assets/css/input.css  →  [tailwindcss --minify]  →  static/css/style.css
```

- Source of truth: [assets/css/input.css](assets/css/input.css)
- Output (gitignored): `static/css/style.css` — gerado pelo CI e localmente via `npm run css:build`
- Config: [tailwind.config.js](tailwind.config.js) — `content` scans `./templates/**/*.html` + `./static/js/**/*.js` for purge
- `node_modules/` e `static/css/style.css` são gitignored; rodar `npm install` após clonar
- Classes geradas dinamicamente em `search.js` estão na `safelist` do `tailwind.config.js`

### Design System — Industrial Retro-Futurista

**Palette** (`tailwind.config.js` → `theme.extend.colors`):

| Token | Hex | Uso |
|---|---|---|
| `deep-shadow` | `#20140D` | Fundo global do body |
| `clay-tan` | `#E7C693` | Texto principal, títulos |
| `aqua-neon` | `#00B5B5` | Links, datas, botões, destaques neon |
| `rust-copper` | `#B57B50` | Bordas de cards, separadores |
| `steel-blue` | `#1F3B4A` | Fundo dos cards, blocos de código |

**Fonts** (Google Fonts, importadas em `base.html`):
- `font-heading` → Oswald / Barlow Condensed — headers, botões, labels
- `font-body` → Montserrat — corpo do texto
- `font-code` → Fira Code — navbar, modal de busca, console GeoGebra

**Componentes customizados** (`@layer components` em `assets/css/input.css`):

| Classe | Descrição |
|---|---|
| `.btn-neon` | Botão com borda aqua-neon, fill no hover |
| `.card-industrial` | Card steel-blue com borda cobre, glow aqua no hover |
| `.divider-industrial` | Separador horizontal em rust-copper |
| `.accent-line` | Barra decorativa aqua sob títulos de seção |
| `.leitura-container` | Fundo `deep-shadow/98` ao redor do conteúdo dos posts (legibilidade) |
| `.prose-blog` | Tipografia completa para posts: p, h1-h6, a, code, pre, blockquote, table, img |
| `.bg-site` | Fundo com imagem + overlay escuro; `fixed` → `scroll` em mobile |
| `.scanlines` | Efeito CRT de linhas horizontais sutis (usado no modal de busca) |

### Template System (Tera)

Templates em `templates/`:

| Template | Purpose |
|---|---|
| `base.html` | Layout base — navbar sticky, modal Command Palette, Google Fonts, Tailwind CSS, Analytics |
| `index.html` | Home page com hero "Industrial Retro-Futurista" |
| `blog.html` | Listagem de posts em grid responsivo de cards |
| `blog-page.html` | Post individual — cabeçalho, painel de telemetria automático, `.leitura-container` |
| `geogebra.html` | Post com Console de Simulação GeoGebra (barra de controle + indicador pulsante) |
| `404.html` | Página de erro customizada |
| `shortcodes/status.html` | Shortcode `{{ status(...) }}` — painel de telemetria para uso em Markdown |

Templates extend `base.html` via `{% extends "base.html" %}` + `{% block content %}`.

### Navbar e Command Palette

**Navbar** (`base.html`): sticky no topo, exibe `// SISTEMA_ONLINE` (link para home) e um botão
`// BUSCAR... ⌘K` que dispara `window.openSearchModal()`.

**Command Palette** (`static/js/search.js`):
- Atalhos: `Cmd+K` / `Ctrl+K` (toggle) · `/` (abre fora de inputs) · `Escape` (fecha)
- Carrega `elasticlunr.min.js` e `search_index.en.js` sob demanda (lazy) na primeira abertura
- `window.BASE_URL` injetado em `base.html` com `| safe` — **obrigatório** para evitar que Tera
  HTML-escape `/` → `&#x2F;` dentro de `<script>`, quebrando todas as URLs
- URLs construídas com `new URL(filename, baseUrl).href` para evitar problemas de concatenação
- `window.searchIndex` (JSON serializado pelo Zola) é carregado via `elasticlunr.Index.load()`
- `window.openSearchModal` exposto globalmente para o botão da navbar

### Painel de Telemetria dos Posts

Exibido automaticamente no topo de cada post em `blog-page.html` e `geogebra.html`:

```
DATE: 2024.01.15  |  LATENCY: --  |  STATUS: ONLINE
```

- `DATE` lido de `page.date` (formato `%Y.%m.%d`)
- `LATENCY` e `STATUS` lidos de `page.extra.latency` / `page.extra.status` (frontmatter `[extra]`)
- Shortcode `{{ status(date="...", latency="...", status="...") }}` disponível para uso em Markdown

### Console de Simulação GeoGebra (`geogebra.html`)

Posts com `template = "geogebra.html"` recebem um wrapper `.console-simulacao`:
- **Barra superior**: `MODULE: MATH_SIM_V1_RUST_CORE` + indicador `animate-pulse`
- **Corpo**: applet GeoGebra com borda interna `border-rust-copper/30`
- **Barra inferior**: `SIM_STATUS: ACTIVE` + botão `ADD_POINT( )`

### Content Structure

Posts em `content/blog/` com frontmatter TOML (`+++`):

```toml
+++
title = "Post Title"
date = 2024-01-15
draft = false
template = "blog-page.html"   # omit to use section default

[extra]
latency = "5ms"     # opcional — exibido no painel de telemetria
status  = "ONLINE"  # opcional — padrão: "ONLINE"
+++
```

Use `template = "geogebra.html"` para posts com visualizações matemáticas interativas.

`content/blog/_index.md` — controla a seção: sort by `date`, template `blog.html`, page_template `blog-page.html`.

### Static Assets

`static/` é copiado para `docs/` no build:
- `css/style.css` — gerado pelo Tailwind (não commitado em `static/`, gerado no CI)
- `js/search.js` — Command Palette (commitado)
- `nova_img.webp` — imagem de fundo referenciada via `.bg-site`
- `favicon.ico`, imagens diversas

### Generated Outputs (in `docs/`)

Zola gera: `atom.xml` (feed), `sitemap.xml`, `robots.txt`, `search_index.en.js` + `elasticlunr.min.js` (usados pela Command Palette).

### Armadilhas Conhecidas

| Problema | Causa | Solução |
|---|---|---|
| URLs malformadas com `&#x2F;` | `{{ config.base_url }}` sem `\| safe` em `<script>` — Tera escapa `/` | Sempre usar `\| safe` para URLs em contexto JS |
| `openModal()` retorna sem abrir | `DOMContentLoaded` já disparou quando script no fim do `<body>` | Usar `document.readyState === 'loading'` antes de registrar o listener |
| Busca retorna sem resultados | `window.searchIndex` é JSON serializado, não objeto elasticlunr | Carregar com `elasticlunr.Index.load(window.searchIndex)` |
| Classes de resultado removidas pelo purge | Tailwind não vê classes em strings JS concatenadas | Usar `safelist` no `tailwind.config.js` + incluir `static/js/**/*.js` em `content` |
