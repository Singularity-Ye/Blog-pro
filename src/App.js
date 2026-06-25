import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import GlobalStyle from './styles/GlobalStyle';
import { scrollPositions } from './utils/scrollCache';
import { HandTrackingProvider } from './utils/useHandTracking';
import GlobalHandCursor from './components/GlobalHandCursor';

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
const SpatialUI = lazy(() => import('./pages/SpatialUI'));

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
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  
  useEffect(() => {
    if (isEmbed) {
      document.body.classList.add('is-embed');
    } else {
      document.body.classList.remove('is-embed');
    }
    return () => {
      document.body.classList.remove('is-embed');
    };
  }, [isEmbed]);

  // If we are directly visiting '/graph' without a background location,
  // we mock the background location as '/atlas' so it always opens as a modal.
  const isGraphRoute = location.pathname === '/graph';
  const backgroundLocation = location.state?.backgroundLocation || (isGraphRoute ? { pathname: '/atlas' } : null);

  // Set scrollRestoration to manual globally
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Listen to scroll events to record position under location.key
  useEffect(() => {
    const handleScroll = () => {
      if (scrollPositions.isNoteLoading) return; // Ignore forced scrolls to 0 while Note page is loading/rendering
      if (location.key) {
        scrollPositions[location.key] = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key]);

  // Restore scroll position for non-note routes
  useEffect(() => {
    const isNoteRoute = location.pathname.startsWith('/note');
    if (!isNoteRoute) {
      const savedScroll = scrollPositions[location.key] || 0;
      const timer = setTimeout(() => {
        window.scrollTo({
          top: savedScroll,
          behavior: 'auto'
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.key, location.pathname]);

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
          <Route path="/spatial-ui" element={<SpatialUI />} />
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
      {!isEmbed && <GlobalNav />}
      <GlobalHandCursor />
    </>
  );
}


function App() {
  return (
    <>
      <GlobalStyle />
      <HandTrackingProvider>
        <Router>
          <AppRoutes />
        </Router>
      </HandTrackingProvider>
    </>
  );
}

export default App;
// deploy sync trigger: 2026-06-24 21:00
