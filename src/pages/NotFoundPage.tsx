export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <h1 className="sr-only">What are you doing here, jabroni?</h1>
      <p className="sr-only">This page doesn’t exist. Try the links above.</p>
      <img
        className="not-found-reaction"
        src="/rock-404.webp"
        srcSet="/rock-404-small.webp 348w, /rock-404.webp 580w"
        sizes="(max-width: 620px) calc(100vw - 48px), 580px"
        alt="The Rock raising one eyebrow, with one large hand in the foreground pointing up toward the navigation links, in 8-bit text art."
        width="580"
        height="675"
      />
    </section>
  );
}
