import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import * as posts from '../src/lib/posts';
import Article, { frontmatter } from './fixtures/article.mdx';
import { motionPreference, scrollTo } from './browser';

beforeEach(() => {
  vi.spyOn(posts, 'getAllPosts').mockReturnValue([]);
  vi.spyOn(posts, 'getPostBySlug').mockReturnValue(undefined);
});

function renderApp(path = '/') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
}

describe('blog navigation', () => {
  it('keeps the sky mounted, moves focus, and restores the planet only on Writing', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    const sky = container.querySelector('.pixel-sky');
    const firstPage = container.querySelector('.page-view');
    expect(container.querySelectorAll('.pixel-planet')).toHaveLength(1);
    expect(screen.getByText('Nothing here yet.')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'about' }));
    expect(
      screen.getByRole('heading', { name: "Hi, I'm Mohamed." }),
    ).toBeVisible();
    expect(container.querySelector('.pixel-planet')).not.toBeInTheDocument();
    expect(container.querySelector('.pixel-sky')).toBe(sky);
    expect(container.querySelector('.page-view')).not.toBe(firstPage);
    expect(screen.getByRole('main')).toHaveFocus();
    expect(document.title).toBe('About — Mohamed Chiboub');
    expect(screen.getByRole('link', { name: 'about' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('link', { name: 'writing' }));
    expect(container.querySelectorAll('.pixel-planet')).toHaveLength(1);
    expect(container.querySelector('.pixel-sky')).toBe(sky);
    expect(document.title).toBe('Writing — Mohamed Chiboub');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('preserves the user motion choice across page changes', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole('button', { name: 'Pause sky animation' }),
    );
    await user.click(screen.getByRole('link', { name: 'about' }));
    expect(
      screen.getByRole('button', { name: 'Play sky animation' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Play sky animation' }),
    );
    expect(
      screen.getByRole('button', { name: 'Pause sky animation' }),
    ).toBeVisible();
  });

  it('starts paused for reduced motion and responds to preference changes', () => {
    motionPreference.matches = true;
    renderApp();
    expect(
      screen.getByRole('button', { name: 'Play sky animation' }),
    ).toBeVisible();
    act(() => motionPreference.set(false));
    expect(
      screen.getByRole('button', { name: 'Pause sky animation' }),
    ).toBeVisible();
  });

  it('keeps an explicit user choice when the system preference changes', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole('button', { name: 'Pause sky animation' }),
    );
    act(() => motionPreference.set(true));
    act(() => motionPreference.set(false));
    expect(
      screen.getByRole('button', { name: 'Play sky animation' }),
    ).toBeVisible();
  });

  it('redirects the old blog index to Writing', () => {
    const { container } = renderApp('/blog');
    expect(
      screen.getByRole('heading', { name: 'Writing' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'writing' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(container.querySelectorAll('.pixel-planet')).toHaveLength(1);
  });

  it('does not mark unrelated path prefixes as Writing', () => {
    renderApp('/blogger');
    expect(screen.getByRole('link', { name: 'writing' })).not.toHaveClass(
      'is-active',
    );
  });

  it('keeps navigation available after a post throws and recovers on the next route', async () => {
    const error = new Error('Broken post component');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(posts, 'getPostBySlug').mockReturnValue({
      meta: { ...frontmatter, tags: [], slug: 'broken' },
      Component: () => {
        throw error;
      },
    });
    const { container } = renderApp('/blog/broken');
    const sky = container.querySelector('.pixel-sky');
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't open this page.",
    );
    expect(document.title).toBe('Page unavailable — Mohamed Chiboub');
    await userEvent.setup().click(screen.getByRole('link', { name: 'about' }));
    expect(
      screen.getByRole('heading', { name: "Hi, I'm Mohamed." }),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.querySelector('.pixel-sky')).toBe(sky);
  });

  it.each(['/missing', '/blog/missing'])(
    'handles %s without the planet and provides a return link',
    async (path) => {
      const user = userEvent.setup();
      const { container } = renderApp(path);
      expect(container.querySelector('.pixel-planet')).not.toBeInTheDocument();
      const back = screen.getByRole('main').querySelector('a');
      expect(back).toHaveAttribute('href', '/');
      if (!back) throw new Error('Missing return link');
      await user.click(back);
      expect(
        screen.getByRole('heading', { name: 'Writing' }),
      ).toBeInTheDocument();
    },
  );

  it.each(['fixture', 'orbital notes'])(
    'opens the post %s, renders MDX, and returns to the index',
    async (postSlug) => {
      const user = userEvent.setup();
      const meta = {
        ...frontmatter,
        tags: frontmatter.tags ?? [],
        slug: postSlug,
      };
      vi.spyOn(posts, 'getAllPosts').mockReturnValue([meta]);
      vi.spyOn(posts, 'getPostBySlug').mockImplementation((slug) =>
        slug === postSlug ? { meta, Component: Article } : undefined,
      );
      const { container } = renderApp();
      expect(container.querySelector('time')).toHaveAttribute(
        'datetime',
        '2026-09-04',
      );
      await user.click(screen.getByRole('link', { name: meta.title }));
      expect(
        screen.getByRole('heading', { level: 1, name: meta.title }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { name: 'A readable article' }),
      ).toBeVisible();
      expect(container.querySelector('.pixel-planet')).not.toBeInTheDocument();
      expect(document.title).toBe(`${meta.title} — Mohamed Chiboub`);
      await user.click(screen.getByRole('link', { name: '← All posts' }));
      expect(screen.getByRole('link', { name: meta.title })).toBeVisible();
    },
  );
});
