import PostList from '../components/PostList';
import PixelPlanet from '../components/space/PixelPlanet';
import { usePageTitle } from '../hooks/usePageTitle';

export default function WritingPage() {
  usePageTitle('Writing');
  return (
    <section className="writing-page" aria-labelledby="writing-title">
      <h1 id="writing-title" className="sr-only">
        Writing
      </h1>
      <p className="page-intro">Notes, mostly about software.</p>
      <PostList />
      <PixelPlanet />
    </section>
  );
}
