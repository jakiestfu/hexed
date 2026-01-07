// Parser
export { readBinaryFile, readBinaryFromFile, getFileSize } from './parser.js';

// Differ
export { computeDiff, hasDiffAtOffset, getDiffAtOffset } from './differ.js';

// Formatter
export {
  byteToHex,
  byteToAscii,
  formatAddress,
  toHexString,
  toAsciiString,
  formatDataIntoRows,
  type FormattedRow
} from './formatter.js';

// Storage
export { InMemoryStorage, createStorageAdapter } from './storage.js';

