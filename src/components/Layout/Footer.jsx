import React from 'react';
import styled from 'styled-components';

const FooterWrapper = styled.footer`
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
  color: #8E8E93;
`;

const Footer = () => {
  return (
    <FooterWrapper>
      <p>© {new Date().getFullYear()} 个人博客. All rights reserved.</p>
    </FooterWrapper>
  );
};

export default Footer; 