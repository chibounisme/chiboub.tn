import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import Layout from './components/Layout';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import PostPage from './pages/PostPage';
import NotFoundPage from './pages/NotFoundPage';
import { getAllPosts, getPostBySlug } from './lib/posts';

export const siteUrl = 'https://chiboub.tn';
const siteDescription =
  'Mohamed Chiboub, software engineer. Notes on building software for the web.';
export interface Assets {
  css: string;
  articleCss: string;
}

export function pagePaths() {
  return [
    '/',
    '/blog/',
    ...getAllPosts().map((post) => `/blog/${encodeURIComponent(post.slug)}/`),
  ];
}

export function renderPage(pathname: string, assets: Assets) {
  const path = pathname.replace(/\/+$/, '') || '/';
  let title = 'Page not found';
  let description = siteDescription;
  let canonical = siteUrl + '/404.html';
  let page: 'about' | 'blog' | 'not-found' = 'not-found';
  let content: ReactNode = <NotFoundPage />;
  let published: string | undefined;
  let status = 404;
  const redirect = path === '/about';

  if (redirect) {
    return {
      html:
        '<!doctype html>' +
        renderToStaticMarkup(
          <html lang="en">
            <head>
              <meta charSet="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>About me | Mohamed Chiboub</title>
              <meta name="description" content={siteDescription} />
              <link rel="canonical" href={siteUrl + '/'} />
              <meta httpEquiv="refresh" content="0;url=/" />
            </head>
            <body>
              <main>
                <a href="/">Continue to About me</a>
              </main>
            </body>
          </html>,
        ),
      status: 200,
    };
  }

  if (path === '/') {
    title = 'About me';
    canonical = siteUrl + '/';
    page = 'about';
    content = <AboutPage />;
    status = 200;
  } else if (path === '/blog') {
    title = 'Blog';
    canonical = siteUrl + '/blog/';
    description = 'Articles by Mohamed Chiboub about software development.';
    page = 'blog';
    content = <BlogPage />;
    status = 200;
  } else if (path.startsWith('/blog/')) {
    let slug = '';
    try {
      slug = decodeURIComponent(path.slice('/blog/'.length));
    } catch {
      /* Invalid URLs render the 404 page. */
    }
    const post = getPostBySlug(slug);
    if (post) {
      title = post.meta.title;
      description =
        post.meta.description || `${title} — an article by Mohamed Chiboub.`;
      canonical = `${siteUrl}/blog/${encodeURIComponent(post.meta.slug)}/`;
      page = 'blog';
      content = <PostPage post={post} />;
      published = post.meta.date;
      status = 200;
    }
  }

  const html =
    '<!doctype html>' +
    renderToStaticMarkup(
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{`${title} | Mohamed Chiboub`}</title>
          <meta name="description" content={description} />
          <meta name="theme-color" content="#101310" />
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={`${title} | Mohamed Chiboub`} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonical} />
          <meta
            property="og:type"
            content={published ? 'article' : 'website'}
          />
          {published && (
            <meta property="article:published_time" content={published} />
          )}
          {status === 404 && <meta name="robots" content="noindex" />}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="stylesheet" href={assets.css} />
          {published && <link rel="stylesheet" href={assets.articleCss} />}
        </head>
        <body>
          <Layout page={page}>{content}</Layout>
        </body>
      </html>,
    );
  return { html, status };
}
