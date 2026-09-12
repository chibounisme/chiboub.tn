import { renderToStaticMarkup } from 'react-dom/server';
import { MDXProvider } from '@mdx-js/react';
import { describe, expect, it } from 'vitest';
import { mdxComponents } from '../src/components/MDXComponents';
import { createPostCatalog, type PostModule } from '../src/lib/postCatalog';
import { formatPostDate } from '../src/lib/dates';
import Article from './fixtures/article.mdx';

describe('post catalog', () => {
  const post = (date: string): PostModule => ({
    default: Article,
    frontmatter: { title: 'A post', date, description: 'A description' },
  });
  it('sorts newest first, resolves equal dates deterministically, and preserves tags', () => {
    const catalog = createPostCatalog({
      'zebra.mdx': post('2026-09-04'),
      'old.mdx': post('2025-01-01'),
      'alpha.mdx': post('2026-09-04'),
    });
    expect(catalog.getAllPosts().map((entry) => entry.slug)).toEqual([
      'alpha',
      'zebra',
      'old',
    ]);
    expect(catalog.getPostBySlug('alpha')?.Component).toBe(Article);
    expect(catalog.getPostBySlug('alpha')?.meta.tags).toEqual([]);
    expect(catalog.getPostBySlug('missing')).toBeUndefined();
    expect(createPostCatalog({}).getAllPosts()).toEqual([]);
    const module = post('2026-09-04');
    module.frontmatter.tags = ['typescript'];
    expect(
      createPostCatalog({ 'tagged.mdx': module }).getAllPosts()[0]?.tags,
    ).toEqual(['typescript']);
  });
});

it('formats dates in UTC and handles invalid input', () => {
  expect(formatPostDate('2026-01-01')).toBe('01 Jan');
  expect(formatPostDate('2026-01-01', true)).toBe('01 Jan 2026');
  expect(formatPostDate('2026-01-01T23:30:00-03:00', true)).toBe('02 Jan 2026');
  expect(formatPostDate('unknown')).toBe('unknown');
});

it('renders MDX as readable HTML with highlighted code and native links', () => {
  document.body.innerHTML = renderToStaticMarkup(
    <MDXProvider components={mdxComponents}>
      <Article />
    </MDXProvider>,
  );
  expect(document.querySelector('pre')?.classList.contains('shiki')).toBe(true);
  expect(document.querySelector('pre code')?.textContent).toContain(
    'const message',
  );
  expect(document.querySelector('table')?.textContent).toContain('TypeScript');
  expect(document.querySelector('input')?.disabled).toBe(true);
  expect(document.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  const external = document.querySelector('a[target="_blank"]');
  expect(external?.getAttribute('rel')).toBe('noopener noreferrer');
  expect(document.querySelector('a[href="/about"]')).not.toBeNull();
});

it('preserves authored link attributes and secures new tabs', () => {
  const Anchor = mdxComponents.a;
  document.body.innerHTML = renderToStaticMarkup(
    <>
      <Anchor href="https://example.com" target="_self" rel="author">
        Author
      </Anchor>
      <Anchor href="//example.com" rel="nofollow noopener">
        Reference
      </Anchor>
      <Anchor href="/document.pdf" download="notes.pdf">
        Download
      </Anchor>
      <Anchor href="mailto:hello@example.com">Email</Anchor>
    </>,
  );
  expect(document.querySelector('a[target="_self"]')?.getAttribute('rel')).toBe(
    'author',
  );
  expect(
    document.querySelector('a[href="//example.com"]')?.getAttribute('rel'),
  ).toBe('nofollow noopener noreferrer');
  expect(document.querySelector('a[download]')?.getAttribute('download')).toBe(
    'notes.pdf',
  );
  expect(
    document.querySelector('a[href^="mailto:"]')?.getAttribute('target'),
  ).toBeNull();
});

it('rejects filenames that would overwrite generated routes', () => {
  const module = {
    default: Article,
    frontmatter: { title: 'Post', date: '2026-09-04', description: '' },
  };
  for (const path of ['.mdx', '..mdx', '...mdx', 'bad\\name.mdx']) {
    expect(() => createPostCatalog({ [path]: module })).toThrow('valid slug');
  }
  expect(() =>
    createPostCatalog({ 'a/post.mdx': module, 'b/post.mdx': module }),
  ).toThrow('Duplicate post slug');
});
