import { render, screen } from '@testing-library/react';
import { MDXProvider } from '@mdx-js/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { mdxComponents } from '../src/components/MDXComponents';
import { createPostCatalog, type PostModule } from '../src/lib/postCatalog';
import { formatPostDate } from '../src/lib/dates';
import Article from './fixtures/article.mdx';

describe('post catalog', () => {
  const post = (date: string): PostModule => ({
    default: Article,
    frontmatter: { title: 'A post', date, description: 'A description' },
  });

  it('sorts newest first and resolves equal dates deterministically', () => {
    const catalog = createPostCatalog({
      '../content/blog/zebra.mdx': post('2026-09-04'),
      '../content/blog/old.mdx': post('2025-01-01'),
      '../content/blog/alpha.mdx': post('2026-09-04'),
    });
    expect(catalog.getAllPosts().map((entry) => entry.slug)).toEqual([
      'alpha',
      'zebra',
      'old',
    ]);
    expect(catalog.getPostBySlug('alpha')?.Component).toBe(Article);
    expect(catalog.getPostBySlug('alpha')?.meta.tags).toEqual([]);
    expect(catalog.getPostBySlug('missing')).toBeUndefined();
  });

  it('supports an empty blog and preserves authored tags', () => {
    expect(createPostCatalog({}).getAllPosts()).toEqual([]);
    const module = post('2026-09-04');
    module.frontmatter.tags = ['typescript'];
    expect(
      createPostCatalog({ 'tagged.mdx': module }).getAllPosts()[0]?.tags,
    ).toEqual(['typescript']);
  });
});

describe('post dates', () => {
  it('formats dates in UTC regardless of the reader timezone', () => {
    expect(formatPostDate('2026-01-01')).toBe('01 Jan');
    expect(formatPostDate('2026-01-01', true)).toBe('01 Jan 2026');
    expect(formatPostDate('2026-01-01T23:30:00-03:00', true)).toBe(
      '02 Jan 2026',
    );
  });

  it('does not crash the page on an invalid date', () => {
    expect(formatPostDate('unknown')).toBe('unknown');
  });
});

it('compiles real MDX through the Vite pipeline with safe links and highlighted code', () => {
  const { container } = render(
    <MemoryRouter>
      <MDXProvider components={mdxComponents}>
        <Article />
      </MDXProvider>
    </MemoryRouter>,
  );
  const external = screen.getByRole('link', { name: 'External link' });
  expect(external).toHaveAttribute('target', '_blank');
  expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  expect(
    screen.getByRole('link', { name: 'internal link' }),
  ).not.toHaveAttribute('target');
  expect(container.querySelector('pre')).toHaveClass('shiki');
  expect(container.querySelector('pre code')).toHaveTextContent(
    'const message',
  );
  expect(screen.getByRole('table')).toHaveTextContent('TypeScript');
  expect(screen.getByRole('checkbox')).toBeDisabled();
  expect(screen.getByRole('checkbox')).toBeChecked();
  expect(screen.getByAltText('A small moon')).toHaveAttribute(
    'loading',
    'lazy',
  );
});

it('preserves authored link attributes and secures new tabs, including protocol-relative URLs', () => {
  const Anchor = mdxComponents.a;
  render(
    <MemoryRouter>
      <Anchor
        href="https://example.com"
        target="_self"
        rel="author"
        className="credit"
      >
        Author
      </Anchor>
      <Anchor href="//example.com" rel="nofollow noopener">
        Reference
      </Anchor>
      <Anchor href="/document.pdf" download="notes.pdf">
        Download
      </Anchor>
      <Anchor href="mailto:hello@example.com">Email</Anchor>
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Author' })).toHaveAttribute(
    'target',
    '_self',
  );
  expect(screen.getByRole('link', { name: 'Author' })).toHaveAttribute(
    'rel',
    'author',
  );
  expect(screen.getByRole('link', { name: 'Author' })).toHaveClass('credit');
  expect(screen.getByRole('link', { name: 'Reference' })).toHaveAttribute(
    'target',
    '_blank',
  );
  expect(screen.getByRole('link', { name: 'Reference' })).toHaveAttribute(
    'rel',
    'nofollow noopener noreferrer',
  );
  expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
    'download',
    'notes.pdf',
  );
  expect(screen.getByRole('link', { name: 'Email' })).not.toHaveAttribute(
    'target',
  );
});

it('navigates internal article links through the router', async () => {
  const Anchor = mdxComponents.a;
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Anchor href="/about">About</Anchor>} />
        <Route path="/about" element={<h1>About page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.setup().click(screen.getByRole('link', { name: 'About' }));
  expect(screen.getByRole('heading', { name: 'About page' })).toBeVisible();
});
