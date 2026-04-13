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

> **Importante:** sempre rodar `npm run css:build` antes de `zola build` se os templates foram alterados. O CSS gerado (`static/css/style.css`) deve ser commitado junto com o build em `docs/`.

No test suite exists. CI runs `zola build` on every push to `main` via `.github/workflows/static.yml` — **the CI does not run `npm run css:build`**, so `static/css/style.css` must be kept up-to-date and committed.

## Architecture

**Zola version:** 0.14.0 (pinned in GitHub Actions — newer versions may have breaking changes)

**Output directory:** `docs/` — committed to git and served by GitHub Pages from that folder.

### CSS Pipeline (Tailwind)

CSS is compiled **outside of Zola** via the Tailwind CLI:

```
assets/css/input.css  →  [tailwindcss --minify]  →  static/css/style.css
```

- Source of truth: [assets/css/input.css](assets/css/input.css)
- Output (committed): `static/css/style.css` (~14 KB minified)
- Config: [tailwind.config.js](tailwind.config.js) — `content` scans `./templates/**/*.html` for purge
- `node_modules/` is gitignored; run `npm install` after cloning

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

**Componentes customizados** (definidos em `@layer components` no `input.css`):

| Classe | Descrição |
|---|---|
| `.btn-neon` | Botão com borda aqua-neon, fill no hover |
| `.card-industrial` | Card steel-blue com borda cobre, glow aqua no hover |
| `.divider-industrial` | Separador `<hr>` horizontal em rust-copper |
| `.accent-line` | Barra decorativa aqua sob títulos de seção |
| `.prose-blog` | Estilos completos de tipografia para conteúdo de posts (p, h1-h6, a, code, pre, blockquote, table, img) |
| `.bg-site` | Fundo com imagem + overlay escuro; troca `fixed` → `scroll` em mobile |

### Template System (Tera)

Six templates in `templates/`:

| Template | Purpose |
|---|---|
| `base.html` | Layout base — Google Fonts, Tailwind CSS, background, Google Analytics |
| `index.html` | Home page com hero "Industrial Retro-Futurista" |
| `blog.html` | Listagem de posts em grid responsivo de cards |
| `blog-page.html` | Post individual com cabeçalho, data e link de retorno |
| `geogebra.html` | Post com applet GeoGebra interativo embutido |
| `404.html` | Página de erro customizada |

Templates extend `base.html` via `{% extends "base.html" %}` + `{% block content %}`.

### Content Structure

Posts live in `content/blog/` with TOML frontmatter (`+++` delimiters):

```toml
+++
title = "Post Title"
date = 2024-01-15
draft = false
template = "blog-page.html"   # omit to use section default
+++

Markdown content here...
```

Use `template = "geogebra.html"` to create an interactive math visualization post.

`content/blog/_index.md` controls the blog section: sorts by `date`, uses `blog.html` for listing and `blog-page.html` as default page template.

### Static Assets

`static/` contents are copied directly to `docs/` at build time:
- `css/style.css` — CSS compilado pelo Tailwind (deve ser commitado)
- `nova_img.webp` — background image referenciada via `.bg-site` no CSS
- `840843081452.jpg`, `matrix-5028024_1920.jpg` — outras imagens
- `favicon.ico`

### Generated Outputs (in `docs/`)

Zola generates: `atom.xml` (feed), `sitemap.xml`, `robots.txt`, `search_index.en.js` + `elasticlunr.min.js` (search, though not wired to UI).
