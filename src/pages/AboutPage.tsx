import { usePageTitle } from '../hooks/usePageTitle';

export default function AboutPage() {
  usePageTitle('About');
  return (
    <article className="about-page">
      <h1>Hi, I'm Mohamed.</h1>
      <p>I'm a software engineer. I build things for the web and beyond.</p>
      <p>
        I like clean systems, weird experiments, and writing things down so I
        don't forget them.
      </p>
      <a
        className="about-link"
        href="https://www.linkedin.com/in/chiboub/"
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
    </article>
  );
}
