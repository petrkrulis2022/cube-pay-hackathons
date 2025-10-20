// Wrapper for js-sha3 to provide proper default export
import {
  keccak_256,
  keccak_512,
  sha3_256,
  sha3_512,
  shake_128,
  shake_256,
} from "js-sha3/src/sha3.js";

// Create the sha3 object that other modules expect
const sha3 = {
  keccak_256,
  keccak_512,
  sha3_256,
  sha3_512,
  shake_128,
  shake_256,
};

// Export both as default and named
export default sha3;
export { keccak_256, keccak_512, sha3_256, sha3_512, shake_128, shake_256 };
