import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderPage, pagePaths } from '../src/render';
import * as posts from '../src/lib/posts';
import Article, { frontmatter } from './fixtures/article.mdx';

const assets = { css: '/assets/site.css', analytics: '/assets/analytics.js' };
const parse = (path: string) =>
  new DOMParser().parseFromString(renderPage(path, assets).html, 'text/html');
beforeEach(() => {
  vi.spyOn(posts, 'getAllPosts').mockReturnValue([]);
  vi.spyOn(posts, 'getPostBySlug').mockReturnValue(undefined);
});

describe('static pages', () => {
  it('renders the complete homepage, native navigation, and no React runtime', () => {
    const doc = parse('/');
    expect(doc.title).toBe('About me | Mohamed Chiboub');
    expect(doc.querySelector('main')?.textContent).toContain(
      "I'm Mohamed Chiboub",
    );
    expect(
      [...doc.querySelectorAll('nav a')].map((a) => a.textContent),
    ).toEqual(['About me', 'Blog', 'GitHub', 'LinkedIn']);
    expect(doc.querySelector('nav a[aria-current]')?.getAttribute('href')).toBe(
      '/',
    );
    expect(doc.querySelector('main h1, canvas, footer')).toBeNull();
    expect(doc.querySelector('main')?.id).toBe('main-content');
    expect(
      [...doc.scripts].map((script) => script.getAttribute('src')),
    ).toEqual([assets.analytics]);
    expect(pagePaths()).toEqual(['/', '/blog/']);
  });
  it('renders a blog index without an introductory heading', () => {
    const doc = parse('/blog/');
    expect(doc.title).toBe('Blog | Mohamed Chiboub');
    expect(doc.querySelector('main')?.textContent).toBe('Nothing here yet.');
    expect(doc.querySelector('h1')).toBeNull();
    expect(doc.querySelector('nav a[aria-current]')?.getAttribute('href')).toBe(
      '/blog/',
    );
    expect(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://chiboub.tn/blog/');
  });
  it('redirects the legacy About URL without JavaScript', () => {
    const doc = parse('/about/');
    expect(
      doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content'),
    ).toBe('0;url=/');
    expect(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://chiboub.tn/');
  });
  it.each(['/missing', '/blog/missing', '/blog/%zz'])(
    'renders a noindex 404 for %s',
    (path) => {
      expect(renderPage(path, assets).status).toBe(404);
      const doc = parse(path);
      expect(doc.querySelector('h1')?.textContent).toBe('Page not found.');
      expect(
        doc.querySelector('meta[name="robots"]')?.getAttribute('content'),
      ).toBe('noindex');
      expect(doc.querySelector('nav a[aria-current]')).toBeNull();
    },
  );
  it.each(['fixture', 'orbital notes'])(
    'renders article content and individual metadata for %s',
    (slug) => {
      const meta = { ...frontmatter, slug, tags: ['typescript'] };
      vi.mocked(posts.getAllPosts).mockReturnValue([meta]);
      vi.mocked(posts.getPostBySlug).mockImplementation((value) =>
        value === slug ? { meta, Component: Article } : undefined,
      );
      const path = `/blog/${encodeURIComponent(slug)}/`;
      expect(pagePaths()).toContain(path);
      const doc = parse(path);
      expect(doc.querySelector('h1')?.textContent).toBe(meta.title);
      expect(doc.querySelector('pre code')?.textContent).toContain(
        'const message',
      );
      expect(
        doc.querySelector('meta[property="og:type"]')?.getAttribute('content'),
      ).toBe('article');
      expect(
        doc.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      ).toBe('https://chiboub.tn' + path);
      expect(
        doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      ).toBe(meta.description);
      expect(doc.querySelector('.back-link')?.getAttribute('href')).toBe(
        '/blog/',
      );
      expect(
        parse('/blog/').querySelector('.post-list a')?.getAttribute('href'),
      ).toBe(path);
    },
  );
  it('escapes metadata and supplies a description for posts without one', () => {
    vi.mocked(posts.getPostBySlug).mockReturnValue({
      meta: {
        ...frontmatter,
        title: '<script>alert(1)</script>',
        description: '',
        tags: [],
        slug: 'safe',
      },
      Component: Article,
    });
    const doc = parse('/blog/safe/');
    expect(doc.title).toBe('<script>alert(1)</script> | Mohamed Chiboub');
    expect(
      doc.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toContain('an article by Mohamed Chiboub');
    expect(doc.scripts.length).toBe(1);
  });
});
