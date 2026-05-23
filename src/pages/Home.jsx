import React from 'react';
import styled from 'styled-components';
import HeroSection3D from '../components/HeroSection3D';

const HomeWrapper = styled.main`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
`;

function Home() {
  return (
    <HomeWrapper>
      <HeroSection3D />
    </HomeWrapper>
  );
}

export default Home;
