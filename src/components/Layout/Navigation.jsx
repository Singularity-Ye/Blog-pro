import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Nav = styled.nav`
  padding: 1rem 2rem;
  background: rgba(5, 0, 15, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 0 rgba(167, 139, 250, 0.15);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 60px;
  display: flex;
  align-items: center;
`;

const NavList = styled.ul`
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  list-style: none;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
`;

const NavItem = styled(motion.li)`
  a {
    color: rgba(224, 231, 255, 0.75);
    font-weight: 500;
    font-size: 0.95rem;
    letter-spacing: 0.02em;
    transition: color 0.2s ease;

    &:hover {
      color: #a78bfa;
    }
  }
`;

const NavSpacer = styled.div`
  height: 60px;
`;

function Navigation() {
  return (
    <>
      <Nav>
        <NavList>
          <NavItem whileHover={{ scale: 1.08 }}>
            <Link to="/">首页</Link>
          </NavItem>
          <NavItem whileHover={{ scale: 1.08 }}>
            <Link to="/blog">博客</Link>
          </NavItem>
          <NavItem whileHover={{ scale: 1.08 }}>
            <Link to="/graph">图谱</Link>
          </NavItem>
          <NavItem whileHover={{ scale: 1.08 }}>
            <Link to="/projects">项目</Link>
          </NavItem>
          <NavItem whileHover={{ scale: 1.08 }}>
            <Link to="/about">关于</Link>
          </NavItem>
          <NavItem whileHover={{ scale: 1.08 }}>
            <Link to="/contact">联系</Link>
          </NavItem>
        </NavList>
      </Nav>

      <NavSpacer />
    </>
  );
}

export default Navigation;
