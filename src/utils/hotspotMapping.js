export const imageRectToPercent = (
  rect,
  imageSize,
  precision = 3
) => {
  const factor = 10 ** precision;
  const toPercent = (value, total) =>
    `${Math.round((value / total) * 100 * factor) / factor}%`;

  return {
    left: toPercent(rect.x, imageSize.width),
    top: toPercent(rect.y, imageSize.height),
    width: toPercent(rect.width, imageSize.width),
    height: toPercent(rect.height, imageSize.height),
  };
};

export const imageRectToObjectPlacement = (
  rect,
  imageSize,
  options = {}
) => {
  const { rotate = '0deg', precision = 3 } = options;
  const factor = 10 ** precision;
  const toPercent = (value, total) =>
    `${Math.round((value / total) * 100 * factor) / factor}%`;

  return {
    left: toPercent(rect.x + rect.width / 2, imageSize.width),
    top: toPercent(rect.y + rect.height / 2, imageSize.height),
    width: toPercent(rect.width, imageSize.width),
    rotate,
  };
};

export const imageRectToRenderedRect = (
  rect,
  imageSize,
  renderedImageRect
) => {
  const scaleX = renderedImageRect.width / imageSize.width;
  const scaleY = renderedImageRect.height / imageSize.height;

  return {
    left: renderedImageRect.left + rect.x * scaleX,
    top: renderedImageRect.top + rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
};

export const imageRectToContainerPercent = (
  rect,
  imageSize,
  renderedImageRect,
  containerRect,
  precision = 3
) => {
  const renderedRect = imageRectToRenderedRect(rect, imageSize, renderedImageRect);
  const factor = 10 ** precision;
  const toPercent = (value, total) =>
    `${Math.round((value / total) * 100 * factor) / factor}%`;

  return {
    left: toPercent(renderedRect.left - containerRect.left, containerRect.width),
    top: toPercent(renderedRect.top - containerRect.top, containerRect.height),
    width: toPercent(renderedRect.width, containerRect.width),
    height: toPercent(renderedRect.height, containerRect.height),
  };
};

export const getContainRect = (imageSize, containerSize) => {
  const scale = Math.min(
    containerSize.width / imageSize.width,
    containerSize.height / imageSize.height
  );
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;

  return {
    left: (containerSize.width - width) / 2,
    top: (containerSize.height - height) / 2,
    width,
    height,
  };
};

export const getCoverRect = (imageSize, containerSize) => {
  const scale = Math.max(
    containerSize.width / imageSize.width,
    containerSize.height / imageSize.height
  );
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;

  return {
    left: (containerSize.width - width) / 2,
    top: (containerSize.height - height) / 2,
    width,
    height,
  };
};
