import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeShiki from '@shikijs/rehype'

export default defineConfig(({ mode }) => ({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        rehypePlugins: [
          [rehypeShiki, { theme: 'vitesse-dark' }],
        ],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  build: {
    rolldownOptions: {
      output: {
        minify: mode === 'production'
          ? { compress: { dropConsole: true, dropDebugger: true } }
          : false,
      },
    },
  },
}))
