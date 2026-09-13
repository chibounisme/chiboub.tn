# chiboub.tn

Mohamed Chiboub's personal blog. Pages are generated as complete HTML at build time and hosted on GitHub Pages. The browser receives HTML, CSS, and optimized images, with no JavaScript, analytics, or downloaded fonts. Content and navigation work with JavaScript disabled.

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
- `src/index.css` configures Tailwind; page and article styles use utilities in the components.
- `scripts/build.ts` bundles the renderer into temporary `.build/`, builds CSS, then writes HTML, a sitemap, and robots.txt into `dist/`. The temporary renderer is removed and never uploaded.
- `scripts/frontmatter.ts` validates post metadata. MDX and Shiki syntax highlighting run at build time. Only trusted, repository-authored MDX should be compiled: it can execute code during the build.
- Text uses Arial, Helvetica, or Liberation Sans with the browser's sans-serif fallback. Dates and code use Courier New, Courier, or Liberation Mono with the browser's monospace fallback. All fonts come from the visitor's device; appearance can vary slightly by operating system.
- Tailwind's Vite plugin scans only components, pages, and article sources. Preflight stays enabled for consistent browser defaults. Vite minifies and fingerprints the shared stylesheet and a separate article stylesheet; only article pages load the latter.
- `/about/` is a minimal redirect with a fallback link, without stylesheet or script requests. Missing pages retain their 404 response and `noindex` metadata.

React, MDX, Vite, and TypeScript are development dependencies. The native compiler is TypeScript 7.0.2, the latest stable release verified on September 13, 2026. The `typescript` alias supplies the TypeScript 6 compiler API required by ESLint; `tsc` and CI type checks use the native TypeScript 7 compiler.

## Contributing

`pnpm install` installs the repository's Husky hooks. Before committing, lint-staged runs ESLint fixes on staged source and configuration files, including Tailwind class sorting. It preserves unstaged changes. The commit-message hook enforces Conventional Commits through commitlint.

Use `type(scope): short description`, for example `fix(blog): correct article links`. Allowed types are `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, and `test`. Scope is optional. Keep commit titles at most 72 characters, start the description in lowercase, and omit a final period. Separate an optional body with a blank line and wrap body/footer lines at 100 characters. Use the body to explain why a change is needed; avoid copying logs or entire PR descriptions.

PR titles follow the same convention, with a 64-character limit to leave room for GitHub's PR-number suffix. CI checks every commit introduced by the PR and its title, including title edits. The repository uses squash merges with the PR title as the commit title and an empty default body. Required PR checks enforce the policy even when local hooks are disabled. Hook installation is disabled in CI; validation runs explicitly there.

Use descriptive branches such as `feat/article-search`, `fix/broken-link`, or `chore/dependency-update`. After merging, delete the feature branch and fast-forward local `main`.

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

`pnpm lint` runs ESLint with zero warnings allowed. All source checks and automatic fixes are configured in `eslint.config.ts`; `pnpm format` runs `eslint --fix`. CI and the staged-file hook use the same configuration.

- TypeScript and JSX use type-aware linting and ESLint Stylistic: two-space indentation, single quotes, semicolons, and trailing commas on multiline structures.
- Tailwind classes in TSX and MDX use the official class order and remove duplicates and unnecessary whitespace, using `src/index.css` as the theme entry point.
- JSON/JSONC and YAML use their ESLint language plugins for syntax, consistency, and style fixes. HTML/SVG use HTML ESLint for indentation, quotes, spacing, and duplicate attributes.
- CSS uses ESLint's CSS plugin with Tailwind syntax support. Markdown uses the GitHub-flavored Markdown rules; MDX uses its own parser and Tailwind checks. CSS and prose retain author-controlled layout rather than automatic full-file reformatting. Stylistic's JavaScript rules are deliberately scoped away from MDX prose.

Generated output, dependency directories, reports, and `pnpm-lock.yaml` are ignored. The staged-file hook accepts ignored paths without warnings, so lockfile-only commits work normally. For editor fixes on save, enable the ESLint extension's `source.fixAll.eslint` action and include the languages above in `eslint.validate`. No separate formatter configuration is needed.

`pnpm check` covers metadata validation, HTML rendering, links, article content, and complete production builds. Integration tests add and remove an MDX post in an isolated temporary project and verify the resulting HTML, assets, sitemap, and absence of browser scripts and downloaded fonts. They also check that invalid content fails the build.

After building, run `pnpm audit:performance` with Chrome installed (or set `CHROME_PATH`). Lighthouse tests every URL in the generated sitemap and the 404 page three times on mobile and desktop, requiring median scores of 100 in all four categories. The 404 page is exempt only from the SEO score because it deliberately uses `noindex`. Every audited page must also meet the blocking-time, layout-shift, and **100 KiB total-transfer budget**. Reports and a summary stay in the ignored `lighthouse-reports/` directory. PR validation and deployment run the same checks. The minimal About redirect is excluded from Lighthouse.

### Image requirements

- Resize raster images for their actual display size before encoding. Prefer compressed WebP or AVIF; changing the extension or using lossless encoding alone is not an optimization strategy.
- The build rejects any published image above **80 KiB (81,920 bytes)**, including unused images copied from `public/` and SVGs. `scripts/image-budget.ts` enforces this limit in local builds, PR checks, and deployment; integration tests verify that oversized images fail the build.
- Supply responsive `srcSet` and `sizes` for different display widths and explicit `width` and `height` to reserve layout space. Keep useful alternative text and an accessible text equivalent for captions embedded in artwork.
- Inspect the final encoded output at desktop and phone sizes for readable text, compression artifacts, background seams, and horizontal overflow. Check the asset selected by the browser as well as the bytes transferred; do not ship original exports or discarded variants.
- The 404 artwork is intentionally pixelated: its largest source matches the 580px text column, with a 348px variant for narrower displays. Both encodings use WebP quality 80 with metadata removed (75,788 and 29,868 bytes respectively). High-density screens can select the larger source, while both remain within the same budget.

Local Lighthouse results measure the production build under simulated conditions. Verify the deployed URLs with PageSpeed Insights after release; hosting latency and Lighthouse version differences can change scores.

GitHub Actions separates PR validation from production deployment:

- `ci.yml` (PR checks) validates pull requests targeting `main`, using a read-only token and no deployment environment or Pages artifact. New commits cancel obsolete checks for that PR.
- `deploy.yml` (Deploy site) runs on pushes to `main` or manual dispatch. Both jobs are restricted to `main`, including manual runs. It validates the merged commit, uploads the resulting `dist/` artifact, and deploys that same artifact only after the build succeeds. Production runs share a concurrency group without cancelling an active deployment.
- `.github/actions/check-site/action.yml` shares dependency setup, formatting, lint, tests, type checking, build, Lighthouse audits, and report retention between the two workflows. Changes to validation apply to both paths.

Only the publish job has Pages and OIDC write permissions, and it uses the `github-pages` environment. Build jobs remain read-only. Deployment uses the artifact from its own run; PR artifacts are never promoted into production. A missing or invalid Pages configuration fails deployment instead of silently skipping it. Official actions are pinned to commit SHAs, checkout does not persist credentials, and dependency installation uses the committed lockfile.

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
