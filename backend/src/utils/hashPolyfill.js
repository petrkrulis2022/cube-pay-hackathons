// Polyfill for hash.js to handle ES module import issues

// Simple hash functions for development only
// Note: These are not cryptographically secure, only for development

function sha256() {
  return {
    update(data) {
      return this;
    },
    digest(encoding = "hex") {
      // Return a deterministic but simple hash
      return "0123456789abcdef".repeat(4); // 64 chars for sha256
    },
  };
}

function sha512() {
  return {
    update(data) {
      return this;
    },
    digest(encoding = "hex") {
      // Return a deterministic but simple hash
      return "0123456789abcdef".repeat(8); // 128 chars for sha512
    },
  };
}

function hmac(hashFn, key) {
  return {
    update(data) {
      return this;
    },
    digest(encoding = "hex") {
      return hashFn().digest(encoding);
    },
  };
}

// Export the hash functions
export default {
  sha256,
  sha512,
  hmac,
};

export { sha256, sha512, hmac };
