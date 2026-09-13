import { MDXProvider } from '@mdx-js/react';
import { ArrowLeft } from 'lucide-react';
import type { PostEntry } from '../lib/postCatalog';
import { mdxComponents } from '../components/MDXComponents';
import { formatPostDate } from '../lib/dates';

export default function PostPage({ post }: { post: PostEntry }) {
  const { meta, Component } = post;
  return (
    <article>
      <a
        href="/blog/"
        className="mb-4.5 inline-flex min-h-11 items-center gap-2 py-2 text-sm leading-[1.8] text-site-text-dim underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        All posts
      </a>
      <header className="mb-9">
        <time
          className="font-mono text-xs leading-[1.8] text-site-text-dim"
          dateTime={meta.date}
        >
          {formatPostDate(meta.date, true)}
        </time>
        <h1 className="mt-2.5 mb-5 text-[clamp(1.6rem,4vw,1.85rem)] leading-[1.35] font-medium tracking-[-0.025em] wrap-anywhere">
          {meta.title}
        </h1>
        {meta.description && (
          <p className="text-site-text-dim">{meta.description}</p>
        )}
        {meta.tags.length > 0 && (
          <ul
            className="mt-3.75 flex list-none flex-wrap gap-3 p-0 font-mono text-xs leading-[1.6] text-site-accent-dim"
            aria-label="Topics"
          >
            {meta.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </header>
      <div className="min-w-0 text-base leading-[1.85] wrap-anywhere [&_:is(h1,h2,h3)]:text-site-text [&_:is(h1,h2,h3,h4,h5,h6)]:mt-9 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-4 [&_:is(h1,h2,h3,h4,h5,h6)]:leading-normal [&_:is(h1,h2,h3,h4,h5,h6)]:font-medium [&_:is(h4,h5,h6)]:tracking-[0.08em] [&_:is(h4,h5,h6)]:text-site-accent-dim [&_:is(h4,h5,h6)]:uppercase [&_:is(p,ul,ol)]:mb-5 [&_:is(pre,code,kbd)]:font-mono [&_:is(th,td)]:px-3 [&_:is(th,td)]:py-2 [&_:is(th,td)]:align-top [&_:is(ul,ol)]:pl-5 [&_:not(pre)>code]:rounded-[3px] [&_:not(pre)>code]:border [&_:not(pre)>code]:border-site-accent/15 [&_:not(pre)>code]:bg-site-accent/8 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-[0.15rem] [&_:not(pre)>code]:text-[0.9em] [&_:not(pre)>code]:text-site-accent [&_a]:text-site-accent [&_a]:underline [&_a]:decoration-site-accent-dim [&_a:hover]:text-white [&_blockquote]:my-6 [&_blockquote]:rounded-r-xs [&_blockquote]:border-l-3 [&_blockquote]:border-site-accent-dim [&_blockquote]:bg-site-accent/5 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-site-text-dim [&_blockquote_p]:mb-2 [&_blockquote_p:last-child]:mb-0 [&_del]:text-site-text-dim [&_h1]:text-[1.55rem] mobile:[&_h1]:text-[1.45rem] [&_h2]:text-[1.22rem] mobile:[&_h2]:text-[1.18rem] [&_h3]:text-[1rem] [&_h4]:text-[0.95rem] [&_h5]:text-[0.875rem] [&_h6]:text-[0.75rem] [&_hr]:my-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-dashed [&_hr]:border-site-surface-border [&_img]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-xs [&_img]:border [&_img]:border-site-surface-border [&_kbd]:rounded-xs [&_kbd]:border [&_kbd]:border-site-surface-border [&_kbd]:bg-black/40 [&_kbd]:px-1.5 [&_kbd]:py-1 [&_kbd]:text-[0.8em] [&_kbd]:text-site-accent [&_li_input]:mr-3 [&_li_input]:accent-site-accent [&_li+li]:mt-2 [&_li::marker]:text-site-accent-dim [&_ol]:list-decimal [&_pre]:my-6 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xs [&_pre]:border [&_pre]:border-site-surface-border [&_pre]:bg-black/60 [&_pre]:px-6 [&_pre]:py-5 [&_pre]:text-[0.85rem] [&_pre]:leading-7 mobile:[&_pre]:p-4 mobile:[&_pre]:text-[0.78rem] mobile:[&_pre]:leading-6 [&_pre_code]:block [&_pre_code]:whitespace-pre [&_strong]:font-bold [&_strong]:text-white [&_table]:min-w-full [&_table]:border-collapse [&_table]:text-left [&_td]:text-site-text-dim [&_th]:text-[0.75rem] [&_th]:font-semibold [&_th]:tracking-[0.08em] [&_th]:text-site-accent [&_th]:uppercase [&_thead]:border-b [&_thead]:border-site-surface-border [&_tr:not(:last-child)]:border-b [&_tr:not(:last-child)]:border-site-surface-border [&_ul]:list-disc [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        <MDXProvider components={mdxComponents}>
          <Component />
        </MDXProvider>
      </div>
    </article>
  );
}
