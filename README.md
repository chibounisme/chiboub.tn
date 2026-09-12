# chiboub.tn

Mohamed Chiboub's personal blog. Pages are generated as complete HTML at build time and hosted on GitHub Pages. The browser receives CSS and a small analytics script, with no React runtime or client router. Content and navigation work with JavaScript disabled.

## Development

Use Node **24.16.0** (`nvm use`) and **pnpm 11.10.0**.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173. Development renders the same templates on request; refresh the browser after editing. There is no production server, database, or environment configuration.

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `pnpm check`           | Formatting, lint, tests with coverage, types, and production build  |
| `pnpm dev`             | Local development server                                            |
| `pnpm build`           | Generate the static site in `dist/`                                 |
| `pnpm preview`         | Serve the production output on port 5173; stop the dev server first |
| `pnpm test:watch`      | Watch tests                                                         |
| `pnpm typecheck:watch` | Watch types                                                         |
| `pnpm format`          | Format source files                                                 |

## Structure

- `src/render.tsx` renders complete HTML documents, route metadata, and the About alias.
- `src/components/` and `src/pages/` are build-time React templates. Use ordinary anchors; browser hooks and event handlers do not run on the published site.
- `src/lib/posts.ts` discovers local MDX files during the build. Article code is never shipped to the browser.
- `src/index.css` and `src/prose.css` define the layout and article styles, compiled with Tailwind.
- `scripts/build.ts` bundles the renderer into temporary `.build/`, builds CSS and analytics, then writes HTML, a sitemap, and robots.txt into `dist/`. The temporary renderer is removed and never uploaded.
- `scripts/frontmatter.ts` validates post metadata. MDX and Shiki syntax highlighting run at build time. Only trusted, repository-authored MDX should be compiled: it can execute code during the build.
- `src/lib/analytics.ts` loads Google Analytics only on the production `chiboub.tn` hostname. Each navigation is a normal page load. Google Fonts supplies DM Sans and IBM Plex Mono.

React, MDX, Vite, and TypeScript are development dependencies. TypeScript 7 supplies the native checker; the TypeScript 6 alias supplies the compiler API required by ESLint.

## Writing posts

Add `.mdx` files to `src/content/blog/`. `my-post.mdx` becomes `/blog/my-post/`.

```mdx
---
title: My post
date: '2026-09-04'
description: A short description for the article and search results.
tags: [typescript, notes]
---

Your article here.
```

Title and a valid `YYYY-MM-DD` date are required; description and tags are optional. Posts appear newest first. Use descriptive filenames such as `my-post.mdx`. Content changes require rebuilding. An invalid post fails the build instead of publishing a broken page.

Routes: `/` (About me), `/blog/`, and `/blog/:slug/`. `/about/` has a static redirect to `/`; `404.html` supplies the not-found page. Each article has its own title, description, canonical URL, Open Graph metadata, and publication date. The sitemap excludes redirects and the 404 page.

## Validation and deployment

`pnpm check` covers metadata validation, HTML rendering, links, article content, analytics, and complete production builds. Integration tests add and remove an MDX post in an isolated temporary project and verify the resulting HTML, assets, sitemap, and absence of a browser React bundle. They also check that invalid content fails the build.

GitHub Actions validates pull requests. Pushes to `main` and manual runs on `main` validate and then deploy `dist/` to Pages. Deployment requires the build job to pass and a configured Pages site. If Pages is not configured, validation still runs and the workflow reports a warning; configure Pages and rerun the workflow to deploy. Official actions are pinned to commit SHAs; installation uses the committed lockfile. Only the deployment job has Pages write permissions.

## GitHub Pages and custom domain

1. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source.
2. Set the custom domain to **chiboub.tn**. `public/CNAME` documents the domain (Actions deployments use the Pages setting), while `src/render.tsx` defines the canonical origin.
3. At the DNS provider, replace the apex (`@`) forwarding A record with GitHub's four A records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. To support `www.chiboub.tn`, add `www` as a CNAME pointing to `chibounisme.github.io`. Do not include a repository path. Keep unrelated mail and verification records.
5. After DNS verification and certificate issuance, enable **Enforce HTTPS** in Pages settings. DNS propagation may take up to 24 hours.
6. Optionally verify ownership under your GitHub account's **Settings → Pages** using the TXT record GitHub provides.

GitHub Pages for a private personal repository requires an eligible paid plan. The published website is public even when the repository is private.

Reference: [GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
