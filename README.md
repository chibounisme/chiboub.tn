# chiboub.tn

_Mohamed Chiboub's personal portfolio and blog, rendered over a hand-written WebGL starfield._

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![MDX](https://img.shields.io/badge/MDX-3-1B1F24?style=flat-square&logo=mdx&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL-Custom-990000?style=flat-square&logo=webgl&logoColor=white)

**Live:** https://chiboub.tn

A single-page React application that serves a personal homepage and an MDX-powered blog, sitting on top of a from-scratch WebGL background that renders animated stars, galaxies, nebulae, and drifting dust clouds. Content is authored in MDX with frontmatter and build-time syntax highlighting, statically built with Vite, and deployed to GitHub Pages. It is the source behind [chiboub.tn](https://chiboub.tn).

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Project Structure](#️-project-structure)
- [Scripts](#-scripts)
- [Related Repositories](#-related-repositories)
- [Author](#-author)

## ✨ Features

- **MDX blog** — posts are plain `.mdx` files with frontmatter (title, date, description, tags); slugs are derived from filenames and posts are sorted by date automatically.
- **Build-time syntax highlighting** — code blocks are highlighted with [Shiki](https://shiki.style) (`vitesse-dark` theme) via a rehype plugin, alongside GitHub Flavored Markdown support.
- **Custom WebGL starfield** — a from-scratch renderer with no 3D framework, composed of independent star, galaxy, nebula, and dust-cloud systems, procedurally generated textures, and a bloom post-processing pass.
- **Adaptive quality** — a quality manager and low-end-device detection (CPU cores / device memory) scale detail and disable bloom on constrained hardware to keep the animation smooth.
- **Client-side routing** — home, blog index, and individual post routes handled by React Router, with a `404.html` fallback so deep links resolve on GitHub Pages.
- **Retro, dark, pixel-inspired UI** — styled with Tailwind CSS v4 and a Fira Code monospace typeface.

## 🧰 Tech Stack

- **Framework:** React 19
- **Language:** TypeScript 5.9
- **Build tool:** Vite 8
- **Styling:** Tailwind CSS v4, PostCSS
- **Routing:** React Router 7
- **Content:** MDX (`@mdx-js/rollup`, `@mdx-js/react`), remark GFM + frontmatter, `remark-mdx-frontmatter`
- **Highlighting:** Shiki (`@shikijs/rehype`)
- **Graphics:** Custom WebGL renderer
- **Hosting:** GitHub Pages via GitHub Actions

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- npm (bundled with Node.js)

### Installation

```bash
git clone https://github.com/chibounisme/chiboub.tn.git
cd chiboub.tn
npm install
```

### Configuration

No environment variables are required to run the project locally.

### Running

Start the development server with hot module replacement:

```bash
npm run dev
```

## 📖 Usage

### Development & build

```bash
npm run dev      # start the Vite dev server
npm run lint     # lint the project with ESLint
npm run build    # build to dist/ and copy index.html to 404.html for SPA routing
npm run preview  # preview the production build locally
```

### Writing posts

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

## 🗂️ Project Structure

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

## 📜 Scripts

| Script            | Description                                                            |
| ----------------- | --------------------------------------------------------------------- |
| `npm run dev`     | Start the Vite development server with HMR.                            |
| `npm run build`   | Build to `dist/` and copy `index.html` to `404.html` for SPA routing. |
| `npm run lint`    | Lint the codebase with ESLint.                                        |
| `npm run preview` | Serve the production build locally for a final check.                 |

## 🔗 Related Repositories

- [chibounis.me](https://github.com/chibounisme/chibounis.me) — companion personal site.

## 👤 Author

**Mohamed Chiboub** — [@chibounisme](https://github.com/chibounisme)
