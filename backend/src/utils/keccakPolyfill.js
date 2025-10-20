// Polyfill for @ethersproject/keccak256 to handle js-sha3 import issues
import { arrayify } from "@ethersproject/bytes";

// Simple implementation that creates a hash-like output
// Note: This is for development only and not cryptographically secure
export function keccak256(data) {
  const bytes = arrayify(data);

  // Create a deterministic but simple hash for development
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
  }

  // Convert to 32-byte hex string (64 chars)
  const hashStr = Math.abs(hash).toString(16).padStart(8, "0");
  const fullHash = (
    hashStr +
    hashStr +
    hashStr +
    hashStr +
    hashStr +
    hashStr +
    hashStr +
    hashStr
  ).substring(0, 64);

  return "0x" + fullHash;
}

// Export as default for compatibility
export default {
  keccak256,
};
