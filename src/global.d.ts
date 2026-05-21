export { };

declare module '*.png';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // 保留空接口，以便将来添加其他元素
    }
  }
} 