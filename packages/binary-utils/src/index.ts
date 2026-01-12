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
  formatFileSize,
  formatBytes,
  formatHex,
  formatBytesPreview,
  type FormattedRow
} from './formatter';

// Storage
export { InMemoryStorage, createStorageAdapter } from './storage';

// Interpreter
export {
  formatNumber,
  readUint8,
  readInt8,
  readUint16,
  readInt16,
  readUint24,
  readInt24,
  readUint32,
  readInt32,
  readUint64,
  readInt64,
  readFloat16,
  readFloat32,
  readFloat64,
  readLEB128,
  readSLEB128,
  readRational,
  readSRational,
  readMSDOSDateTime,
  readOLEDateTime,
  readUnixDateTime,
  readMacHFSDateTime,
  readMacHFSPlusDateTime,
  readUTF8Char,
  readUTF16Char,
  readBinary,
  type Endianness,
  type NumberFormat,
} from './interpreter';

// Strings
export {
  extractStrings,
  type StringMatch,
  type StringEncoding,
  type StringsOptions,
} from './strings';

// Search
export {
  searchHex,
  searchText,
} from './search';
