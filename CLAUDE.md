# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimalist personal portfolio website for Onur Karalı hosted on GitHub Pages. The site is a **static HTML website** with only 3 pages - all HTML files are pre-generated and committed to the repository. No build step required, no Jekyll, no dependencies.

GitHub Pages serves the HTML files directly from the main branch.

## Site Structure

```
/
├── index.html              # Main landing page (about)
├── cv/
│   └── index.html          # CV/Resume page
├── publications/
│   └── index.html          # Publications listing
├── assets/                 # Static assets
│   ├── css/                # Stylesheets (main.css)
│   ├── js/                 # JavaScript files (theme, dark mode, common)
│   ├── img/                # Images and photos
│   ├── pdf/                # PDF documents (e.g., CV)
│   └── bibliography/       # Bibliography data
├── _templates/             # Hidden page templates for future reference
│   ├── blog/               # Blog post example
│   ├── news/               # News announcement example
│   └── projects/           # Project page example
├── 404.html                # Custom 404 error page
├── sitemap.xml             # Site map for SEO
└── robots.txt              # Search engine directives
```

**Note:** The `_templates/` directory is ignored by GitHub Pages (underscore prefix) and serves as reference for future page types.

## Development Workflow

This is as simple as it gets - just edit HTML files and push to GitHub.

### Testing Locally

```bash
# Option 1: Open HTML file directly in browser
open index.html

# Option 2: Use a simple HTTP server
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Making Changes

**Update content:**
- Edit `index.html` for the about page
- Edit `/cv/index.html` for CV
- Edit `/publications/index.html` for publications

**Update styles:**
- Edit `/assets/css/main.css` for global styles
- Changes apply across all 3 pages

**Update images:**
- Add/replace files in `/assets/img/`
- Update HTML `<img>` or `<picture>` tags accordingly

**Deploy:**
```bash
git add .
git commit -m "update content"
git push origin main
```

Changes go live automatically on GitHub Pages within 1-2 minutes.

### Adding New Pages (Future)

Use templates in `_templates/` as reference:
- `_templates/blog/` - for blog posts
- `_templates/news/` - for announcements
- `_templates/projects/` - for project showcases

Remember to:
1. Add navigation link in all 3 pages (index.html, cv/index.html, publications/index.html)
2. Update sitemap.xml
3. Maintain consistent header/footer structure

## Technical Details

### Dependencies (All CDN-hosted)

- **Bootstrap 4.6.1** - Base CSS framework
- **MDB** - Material Design components
- **FontAwesome 5.15.4** - Icons
- **jQuery 3.6.0** - DOM manipulation
- **MathJax 3.2.0** - Mathematical notation

No npm, no bundler, no build process.

### Page Structure

All 3 pages share the same structure:
```html
<head>
  - Metadata
  - CDN stylesheets (Bootstrap, MDB, FontAwesome)
  - /assets/css/main.css
  - Dark mode scripts
</head>
<body>
  <nav> Fixed top navbar with dark mode toggle </nav>
  <div class="container"> Page content </div>
  <footer> Copyright notice </footer>
  <scripts> jQuery, Bootstrap, MDB, custom JS </scripts>
</body>
```

### Custom JavaScript

Located in `/assets/js/`:
- `theme.js` - Theme management
- `dark_mode.js` - Dark/light mode toggle
- `common.js` - Utilities
- `zoom.js` - Image zoom
- `masonry.js` - Image grid layout

### Styling

- Custom styles in `/assets/css/main.css`
- Dark mode support (user preference saved in localStorage)
- Responsive images with multiple sizes (480w, 800w, 1400w)
- Mobile-first responsive design

### Important

- Navigation must be updated in all 3 HTML files when adding pages
- Images should have responsive variants for performance
- All dependencies load from CDNs with integrity hashes
