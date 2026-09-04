# chiboub.tn

Mohamed Chiboub's personal blog, built with React 19, TypeScript 7, Vite 8, Tailwind 4, and MDX.

## Development

Use Node **24.16.0** (`nvm use`) and **pnpm 11.10.0**.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173. No environment variables or backend services are required.

| Command                | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `pnpm check`           | Formatting, lint, tests with coverage, type checking, production build |
| `pnpm typecheck:watch` | Continuous type checking alongside Vite                                |
| `pnpm test:watch`      | Vitest watch mode                                                      |
| `pnpm format`          | Format the codebase                                                    |
| `pnpm build`           | Build `dist/` with route entry points for GitHub Pages                 |
| `pnpm preview`         | Serve the production build locally                                     |

## Code structure

- `src/App.tsx` defines routes; `Layout.tsx` owns navigation, focus, page error recovery, and the persistent sky.
- `src/components/space/` separates canvas lifecycles from drawing. Animation stops when paused, when the tab is hidden, or by default for reduced motion.
- `src/lib/posts.ts` discovers MDX content; `postCatalog.ts` sorts posts and resolves slugs.
- `src/prose.css` styles article content. MDX adapters handle links, scrollable code/tables, and image loading.
- `scripts/frontmatter.ts` validates post metadata during compilation. MDX and syntax highlighting compile at build time.
- Analytics loads only in production on `chiboub.tn`.

TypeScript 7 supplies the native checker through `@typescript/native`. The `typescript` alias supplies the TypeScript 6 compiler API required by ESLint, following Microsoft's [side-by-side configuration](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

## Writing posts

Add `.mdx` files to `src/content/blog/`. `my-post.mdx` becomes `/blog/my-post`.

```mdx
---
title: My post
date: '2026-09-04'
description: A short introduction above the article.
tags: [typescript, notes]
---

Your article here.
```

Title and a valid `YYYY-MM-DD` date are required; description and tags are optional. Posts appear newest first. Internal links use client-side navigation. The index shows an empty state until posts are added.

## Verification and deployment

Tests cover navigation, error recovery, MDX compilation, analytics, motion preferences, animation cleanup, text exclusion, and deterministic planet drawing. Coverage thresholds are 85% for lines, statements, and functions and 80% for branches; HTML reports appear in `coverage/`. Canvas tests record drawing commands; visual layout also requires browser checks.

GitHub Actions runs `pnpm check` on pull requests, pushes to `main`, and manual runs. Only successful non-PR runs deploy to GitHub Pages. `public/CNAME` sets the domain. The build emits entry points for About, the legacy blog index, and each article, so known deep links resolve on Pages. `404.html` handles unknown URLs. Pages still render content on the client.

Routes: `/` (Writing), `/about`, and `/blog/:slug`. `/blog` redirects to `/`; unmatched URLs show a not-found page. The large planet appears only on Writing.
