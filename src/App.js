import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GlobalStyle from './styles/GlobalStyle';

// 页面组件
import Home from './pages/Home';
import Blog from './pages/Blog';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Note from './pages/Note';
import GraphView from './components/GraphView/GraphView';
import Layout from './components/Layout';

function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:category" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/note/*" element={<Note />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App; 
