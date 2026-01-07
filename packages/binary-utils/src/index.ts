// Parser
export { readBinaryFile, readBinaryFromFile, getFileSize } from './parser';

// Differ
export { computeDiff, hasDiffAtOffset, getDiffAtOffset } from './differ';

// Formatter
export {
  byteToHex,
  byteToAscii,
  formatAddress,
  toHexString,
  toAsciiString,
  formatDataIntoRows,
  type FormattedRow
} from './formatter';

// Storage
export { InMemoryStorage, createStorageAdapter } from './storage';

