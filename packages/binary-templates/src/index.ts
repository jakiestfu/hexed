import manifestData from "./ksy/manifest.json";
import { KsySchema } from "./ksy/types";
export const manifest = manifestData;

import templates from "./templates";
// @ts-expect-error - kaitai-struct doesn't have TypeScript definitions
import { KaitaiStream } from "kaitai-struct";

/**
 * Loads a parser class by its ksy file path
 * @param path - The ksy file path (e.g., "3d/gltf_binary.ksy")
 * @returns Promise that resolves to the parser class constructor
 * @throws Error if the path is not found in the templates registry
 */
export async function load(path: string): Promise<{
  ParserClass: new (io: unknown, parent: unknown, root: unknown) => unknown;
  spec: KsySchema;
}> {
  const importFn = templates[path as keyof typeof templates];

  if (!importFn) {
    const availablePaths = Object.keys(templates).join(", ");
    throw new Error(
      `No parser found for path "${path}". Available paths: ${availablePaths}`
    );
  }

  // Call the lazy import function
  const parserModule = await importFn();

  let ParserClass: new (io: unknown, parent: unknown, root: unknown) =>
    | unknown
    | undefined;

  const defaultExport = parserModule.default;
  const spec = (parserModule as { spec: KsySchema }).spec;

  try {
    ParserClass = Object.values(defaultExport)[0] as new (
      io: unknown,
      parent: unknown,
      root: unknown
    ) => unknown;
  } catch (error) {
    throw new Error(
      `Parser module for "${path}" does not export a parser class`
    );
  }

  return {
    ParserClass,
    spec,
  };
}

/**
 * Parses binary data using a Kaitai Struct parser template
 * @param templateId - The ksy file path (e.g., "3d/gltf_binary.ksy")
 * @param byteData - The binary data to parse (Uint8Array or ArrayBuffer)
 * @returns Promise that resolves to the parsed data
 */
export async function parse(
  templateId: string,
  byteData: Uint8Array | ArrayBuffer
): Promise<{
  parsedData: unknown;
  spec: KsySchema;
}> {
  const kaitaiStream = new KaitaiStream(byteData, 0);
  const { ParserClass, spec } = await load(templateId);
  return {
    parsedData: new ParserClass(kaitaiStream, 0, 0),
    spec,
  };
}
