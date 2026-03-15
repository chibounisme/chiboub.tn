import { Routes, Route } from 'react-router-dom';
import StarField from './components/starfield';
import Layout from './components/Layout';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

const STATIC_STARFIELD_CONFIG = {
  stars: {
    densityMultiplier: 1.2,
    densityFactor: 180,
  },
  galaxies: {
    countMultiplier: 1.5,
    min: 36,
    max: 72,
  },
  nebulae: {
    countMultiplier: 1.8,
    min: 3,
    max: 6,
  },
  dustClouds: {
    count: 10,
    minAlpha: 0.018,
    maxAlpha: 0.05,
  },
  bloom: {
    enabled: true,
    disableOnLowEnd: true,
    lowEndMaxCores: 4,
    lowEndMaxMemoryGb: 4,
  },
} as const;

function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-site-bg">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StarField config={STATIC_STARFIELD_CONFIG} />
      </div>

      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;
