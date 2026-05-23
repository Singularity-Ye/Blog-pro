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

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <Layout>
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
      </Layout>
      {backgroundLocation && (
        <Routes>
          <Route path="/graph" element={<GraphView modal onClose={() => navigate(-1)} />} />
        </Routes>
      )}
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
