import type { ComponentPropsWithoutRef, JSX, ReactNode } from 'react';

type HtmlComponents = {
  [Tag in keyof JSX.IntrinsicElements]?: (
    props: ComponentPropsWithoutRef<Tag>,
  ) => ReactNode;
};

export const mdxComponents = {
  a: ({
    href,
    target,
    rel,
    download,
    ...props
  }: Omit<ComponentPropsWithoutRef<'a'>, 'download'> & {
    download?: boolean | string;
  }) => {
    const external = /^(https?:)?\/\//i.test(href ?? '');
    const linkTarget = target ?? (external ? '_blank' : undefined);
    const linkRel =
      linkTarget === '_blank'
        ? [
            ...new Set([
              ...(rel?.split(/\s+/).filter(Boolean) ?? []),
              'noopener',
              'noreferrer',
            ]),
          ].join(' ')
        : rel;
    const attributes = { ...props, target: linkTarget, rel: linkRel, download };

    return <a href={href} {...attributes} />;
  },
  pre: (props) => <pre tabIndex={0} {...props} />,
  table: (props) => (
    <div
      className="table-scroll"
      role="region"
      aria-label="Scrollable table"
      tabIndex={0}
    >
      <table {...props} />
    </div>
  ),
  img: ({ alt = '', loading = 'lazy', ...props }) => (
    <img alt={alt} loading={loading} {...props} />
  ),
} satisfies HtmlComponents;
