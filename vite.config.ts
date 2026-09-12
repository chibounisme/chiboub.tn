import { defineConfig, type Plugin } from 'vite';
import type * as Renderer from './src/render.tsx';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeShiki from '@shikijs/rehype';
import {
  parseFrontmatter,
  remarkRequireFrontmatter,
} from './scripts/frontmatter.ts';

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          remarkRequireFrontmatter,
          [
            remarkMdxFrontmatter,
            { name: 'frontmatter', parsers: { yaml: parseFrontmatter } },
          ],
        ],
        rehypePlugins: [[rehypeShiki, { theme: 'vitesse-dark' }]],
      }),
    },
    tailwindcss(),
    staticPreview(),
  ],
  server: { strictPort: true },
});

// Development renders the same templates as the build. No client app or hydration.
function staticPreview(): Plugin {
  return {
    name: 'static-page-preview',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (
          !req.headers.accept?.includes('text/html') ||
          pathname.startsWith('/src/') ||
          pathname.startsWith('/@')
        )
          return next();
        void (async () => {
          const renderer = (await server.ssrLoadModule(
            '/src/render.tsx',
          )) as typeof Renderer;
          const result = renderer.renderPage(pathname, {
            css: '/src/index.css?direct',
          });
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(result.html);
        })().catch(next);
      });
    },
  };
}
