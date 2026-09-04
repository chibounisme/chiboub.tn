import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
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
    react({ include: /\.(mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
  server: { strictPort: true },
});
