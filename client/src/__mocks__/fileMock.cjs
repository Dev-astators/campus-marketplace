// src/__mocks__/fileMock.cjs
// Jest can't import binary files (images, fonts, SVGs).
// This mock returns a plain string so imports don't throw.
module.exports = "test-file-stub";
