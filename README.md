# chiboub.tn

Source code for [chiboub.tn](https://chiboub.tn) — Mohamed Chiboub's personal portfolio and blog, rendered over a custom WebGL starfield.

## Overview

A single-page React application that serves a personal homepage and an MDX-powered blog. Content is authored in MDX with frontmatter and syntax highlighting, and the whole site sits on top of a hand-written WebGL background that renders animated stars, galaxies, nebulae, and drifting dust clouds with an optional bloom pass. The site is statically built with Vite and deployed to GitHub Pages.

## Features

- **MDX blog** — posts are plain `.mdx` files with frontmatter (title, date, description, tags); slugs are derived from filenames and posts are sorted by date automatically.
- **Syntax highlighting** — code blocks are highlighted at build time with [Shiki](https://shiki.style) (`vitesse-dark` theme) via a rehype plugin, plus GitHub Flavored Markdown support.
- **Custom WebGL starfield** — a from-scratch WebGL renderer (no 3D framework) composed of independent star, galaxy, nebula, and dust-cloud systems, procedurally generated textures, and a bloom post-processing pass.
- **Adaptive quality** — a quality manager and low-end-device detection (CPU cores / device memory) scale detail and disable bloom on constrained hardware to keep the animation smooth.
- **Client-side routing** — home, blog index, and individual post routes handled by React Router, with a 404 fallback so deep links work on GitHub Pages.
- **Retro, dark, pixel-inspired UI** — styled with Tailwind CSS v4 and a Fira Code monospace typeface.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4, PostCSS |
| Routing | React Router 7 |
| Content | MDX (`@mdx-js/rollup`), remark GFM + frontmatter, `remark-mdx-frontmatter` |
| Highlighting | Shiki (`@shikijs/rehype`) |
| Graphics | Custom WebGL |
| Hosting | GitHub Pages (GitHub Actions) |

## Prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- npm (bundled with Node.js)

## Installation

```bash
git clone https://github.com/chibounisme/chiboub.tn.git
cd chiboub.tn
npm install
```

## Usage

Start the development server (Vite, with hot module replacement):

```bash
npm run dev
```

Lint the project:

```bash
npm run lint
```

Build for production (outputs to `dist/`, and copies `index.html` to `404.html` for SPA routing on GitHub Pages):

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Writing posts

Blog posts live in `src/content/blog/` as `.mdx` files. Each post begins with frontmatter, and the filename becomes the URL slug (`src/content/blog/my-post.mdx` → `/blog/my-post`):

```mdx
---
title: My Post
date: 2026-01-01
description: A short summary shown in listings.
tags: [web, notes]
---

Your MDX content here.
```

## Project structure

```
src/
├── components/
│   ├── starfield/        # WebGL background renderer
│   │   ├── core/         # render pipeline, quality manager, resource manager
│   │   ├── systems/      # star, galaxy, nebula, dust-cloud, bloom systems
│   │   └── textures/     # procedural texture generation
│   ├── Layout.tsx        # page shell
│   ├── Icons.tsx
│   └── MDXComponents.tsx # element mapping for MDX rendering
├── content/blog/         # MDX blog posts
├── lib/posts.ts          # post loading, slugs, sorting
├── pages/                # Home, Blog, BlogPost
├── App.tsx               # routes + starfield mount
└── main.tsx              # entry point
```

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the site and publishes `dist/` to GitHub Pages. The custom domain is configured through `public/CNAME` (`chiboub.tn`).

## Related repositories

- [chibounis.me](https://github.com/chibounisme/chibounis.me) — companion personal site.
