module.exports = function setupMalformedUrlGuard(app) {
  app.use((req, res, next) => {
    const sanitizedUrl = req.url.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');

    if (sanitizedUrl !== req.url) {
      res.redirect(302, sanitizedUrl);
      return;
    }

    next();
  });
};
