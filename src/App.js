import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import GlobalStyle from './styles/GlobalStyle';

// Landing page loads eagerly
import Home from './pages/Home';
import Layout from './components/Layout';
import GlobalNav from './components/GlobalNav';
import ErrorBoundary from './components/ErrorBoundary';

// Heavy pages lazy-loaded for code splitting
const Blog = lazy(() => import('./pages/Blog'));
const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const Note = lazy(() => import('./pages/Note'));
const Atlas = lazy(() => import('./pages/Atlas'));
const GraphView = lazy(() => import('./components/GraphView/GraphView'));

const PageFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', color: 'rgba(245,239,227,0.45)',
    fontFamily: '"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif',
    fontSize: '0.85rem',
  }}>
    正在展开卷轴...
  </div>
);

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // If we are directly visiting '/graph' without a background location,
  // we mock the background location as '/atlas' so it always opens as a modal.
  const isGraphRoute = location.pathname === '/graph';
  const backgroundLocation = location.state?.backgroundLocation || (isGraphRoute ? { pathname: '/atlas' } : null);

  return (
    <>
      <Layout>
        <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
        <Routes location={backgroundLocation || location}>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:category" element={<Blog />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/atlas" element={<Atlas />} />
          <Route path="/atlas/:type" element={<Atlas />} />
          <Route path="/graph" element={<GraphView />} />
          <Route path="/note/*" element={<Note />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </Layout>
      {backgroundLocation && (
        <Suspense fallback={null}>
        <Routes>
          <Route 
            path="/graph" 
            element={
              <GraphView 
                modal 
                onClose={() => navigate(location.state?.backgroundLocation ? -1 : '/atlas')} 
              />
            } 
          />
        </Routes>
        </Suspense>
      )}
      <GlobalNav />
    </>
  );
}

function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <AppRoutes />
      </Router>
    </>
  );
}

export default App;
// deploy sync trigger: 2026-05-23 19:55
