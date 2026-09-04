import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import WritingPage from './pages/WritingPage';
import AboutPage from './pages/AboutPage';
import PostPage from './pages/PostPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WritingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<Navigate to="/" replace />} />
        <Route path="/blog/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
