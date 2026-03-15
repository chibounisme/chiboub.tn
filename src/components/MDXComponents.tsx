import type { ComponentPropsWithoutRef } from 'react';
import type { MDXComponents } from 'mdx/types';

const headingBaseClass = 'mt-9 mb-4 font-semibold leading-[1.5] text-site-accent first:mt-0';

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const mdxComponents: MDXComponents = {
  h1: ({ className, ...props }) => (
    <h1 className={joinClasses(headingBaseClass, 'text-[1.45rem] sm:text-[1.55rem]', className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={joinClasses(headingBaseClass, 'text-[1.18rem] sm:text-[1.22rem]', className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={joinClasses(headingBaseClass, 'text-base', className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={joinClasses(headingBaseClass, 'text-[0.95rem] uppercase tracking-[0.08em] text-site-accent-dim', className)} {...props} />
  ),
  h5: ({ className, ...props }) => (
    <h5 className={joinClasses(headingBaseClass, 'text-sm uppercase tracking-[0.08em] text-site-accent-dim', className)} {...props} />
  ),
  h6: ({ className, ...props }) => (
    <h6 className={joinClasses(headingBaseClass, 'text-xs uppercase tracking-[0.12em] text-site-accent-dim', className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={joinClasses('mb-5 text-sm leading-7 last:mb-0 sm:text-base sm:leading-8', className)} {...props} />
  ),
  a: (props) => {
    const isExternal =
      typeof props.href === 'string' && /^https?:\/\//.test(props.href);
    return (
      <a
        className={joinClasses(
          'text-site-accent underline decoration-site-accent-dim underline-offset-4 transition-colors duration-100 hover:text-white',
          props.className,
        )}
        {...props}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      />
    );
  },
  ul: ({ className, ...props }) => (
    <ul
      className={joinClasses(
        'mb-5 space-y-2 pl-5 list-disc text-sm leading-7 marker:text-site-accent-dim sm:text-base sm:leading-8 [&>li>p]:inline',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={joinClasses(
        'mb-5 space-y-2 pl-5 list-decimal text-sm leading-7 marker:text-site-accent-dim sm:text-base sm:leading-8 [&>li>p]:inline',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={joinClasses('[&_input]:mr-3 [&_input]:translate-y-px', className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={joinClasses(
        'my-6 rounded-r-sm border-l-[3px] border-site-accent-dim bg-site-accent/5 px-4 py-3 text-sm leading-7 text-site-text-dim sm:px-5 sm:text-base sm:leading-8 [&>p]:mb-2 [&>p:last-child]:mb-0',
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={joinClasses(
        'my-6 overflow-x-auto rounded-sm border border-site-surface-border px-4 py-4 text-[0.78rem] leading-6 sm:px-6 sm:py-5 sm:text-[0.85rem] sm:leading-7 [&_.line]:block [&_code]:block [&_code]:whitespace-pre [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit [&_code]:border-0',
        className?.includes('shiki') ? 'bg-transparent' : 'bg-black/55 text-site-text',
        className,
      )}
      {...props}
    />
  ),
  code: ({ children, className, ...rest }) => {
    if (className) {
      return <code className={className} {...rest}>{children}</code>;
    }
    return (
      <code
        className="rounded-[3px] border border-site-accent/15 bg-site-accent/8 px-1.5 py-[0.15rem] text-[0.9em] text-site-accent"
        {...rest}
      >
        {children}
      </code>
    );
  },
  table: ({ className, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table className={joinClasses('min-w-full border-collapse text-left text-sm sm:text-base', className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={joinClasses('border-b border-site-surface-border text-site-accent', className)} {...props} />
  ),
  tbody: ({ className, ...props }) => <tbody className={className} {...props} />,
  tr: ({ className, ...props }) => (
    <tr className={joinClasses('border-b border-site-surface-border/60 last:border-b-0', className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th className={joinClasses('px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] sm:px-4', className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={joinClasses('px-3 py-2 align-top text-site-text-dim sm:px-4', className)} {...props} />
  ),
  img: ({ className, alt, loading, ...props }: ComponentPropsWithoutRef<'img'>) => (
    <img
      className={joinClasses('my-6 h-auto w-full rounded-sm border border-site-surface-border object-cover', className)}
      alt={alt ?? ''}
      loading={loading ?? 'lazy'}
      {...props}
    />
  ),
  input: ({ className, type, ...props }: ComponentPropsWithoutRef<'input'>) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          className={joinClasses('accent-site-accent', className)}
          disabled
          {...props}
        />
      );
    }

    return <input type={type} className={className} {...props} />;
  },
  del: ({ className, ...props }) => (
    <del className={joinClasses('text-site-text-dim/80 line-through', className)} {...props} />
  ),
  kbd: ({ className, ...props }) => (
    <kbd
      className={joinClasses(
        'rounded-sm border border-site-surface-border bg-black/40 px-1.5 py-1 text-[0.8em] text-site-accent',
        className,
      )}
      {...props}
    />
  ),
  br: () => <br />,
  hr: () => <hr className="my-10 border-0 border-t border-dashed border-site-surface-border" />,
  strong: ({ className, ...props }) => <strong className={joinClasses('font-bold text-white', className)} {...props} />,
  em: ({ className, ...props }) => <em className={joinClasses('italic text-site-accent-alt', className)} {...props} />,
};
