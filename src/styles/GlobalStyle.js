import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* 重置默认样式 */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      sans-serif;
    line-height: 1.6;
    color: #e0e7ff;
    background: #05000f;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    background: #05000f;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyle; 