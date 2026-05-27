import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import GlobalStyle from './styles/GlobalStyle';

// 页面组件
import Home from './pages/Home';
import Blog from './pages/Blog';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Note from './pages/Note';
import Atlas from './pages/Atlas';
import GraphView from './components/GraphView/GraphView';
import Layout from './components/Layout';
import GlobalNav from './components/GlobalNav';
import ErrorBoundary from './components/ErrorBoundary';

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
        </ErrorBoundary>
      </Layout>
      {backgroundLocation && (
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
