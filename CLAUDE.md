# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minimalist personal portfolio for Onur Karalı on GitHub Pages. Pure static HTML — no build step, no Jekyll, no npm. Just edit HTML and push to `main`.

## Local Dev

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Use a local server (not `open index.html`) because asset paths are root-relative (`/assets/css/main.css`).

## Architecture

**3 pages, each a standalone HTML file sharing identical `<head>`, `<nav>`, and `<footer>` blocks:**
- `index.html` — About/landing page
- `cv/index.html` — CV/Resume
- `publications/index.html` — Publications listing

There is no templating system. The shared boilerplate (CDN links, navbar, footer, script tags) is duplicated across all 3 files. **Any structural change (nav links, CDN versions, footer text, script order) must be applied to all 3 files manually.**

### Navbar inconsistency to be aware of

`index.html` omits the `<a class="navbar-brand">` element that the other two pages include. Each page marks its own nav item as `active` with `class="nav-item active"` and a `<span class="sr-only">(current)</span>`.

### Dark mode

Theme system loads in `<head>` (before body render) to prevent flash:
1. `theme.js` — reads `localStorage("theme")`, sets `data-theme` attribute on `<html>`, swaps syntax highlight stylesheets
2. `dark_mode.js` — binds click handler on `#light-toggle` button
3. CSS custom properties in `main.css` (`:root` for light, `html[data-theme='dark']` for dark)

### CSS theming

All colors use CSS custom properties (`--global-bg-color`, `--global-theme-color`, `--global-hover-color`, etc.) defined at the top of `assets/css/main.css`. The theme color is `#B509AC` (light) / `#2698BA` (dark).

### Image convention

Images use responsive `<picture>` elements with 3 WebP srcsets (`-480.webp`, `-800.webp`, `-1400.webp`) plus a JPG/PNG fallback. When adding images, provide all 4 variants.

### CDN dependencies (all loaded with SRI hashes)

Bootstrap 4.6.1, MDB 4.20.0, FontAwesome 5.15.4, Academicons 1.9.1, jQuery 3.6.0, Masonry 4.2.2, Medium Zoom 1.0.6, MathJax 3.2.0, Popper.js 2.11.2.

### Templates

`_templates/` contains reference page layouts (blog, news, projects). The underscore prefix makes GitHub Pages ignore this directory.

## Key constraints

- **No build process** — everything is hand-edited HTML/CSS/JS
- **All 3 pages must stay in sync** for nav, head, footer, and script blocks
- **Root-relative paths** (`/assets/...`) — works on GitHub Pages but not with `file://`
- Update `sitemap.xml` when adding/removing pages
