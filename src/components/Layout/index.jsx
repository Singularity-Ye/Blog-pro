import React from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  position: relative;
  z-index: 1;
`;

const Main = styled(motion.main)`
  flex: 1;
  padding: 0;          /* Hero 区自管尺寸，不需要外部 padding */
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
  overflow-x: hidden;
`;

const Layout = ({ children }) => {
  const location = useLocation();
  const isImmersivePage = location.pathname === '/' || location.pathname.startsWith('/blog');

  return (
    <LayoutWrapper>
      <Main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </Main>
      {!isImmersivePage && <Footer />}
    </LayoutWrapper>
  );
};

export default Layout; 
