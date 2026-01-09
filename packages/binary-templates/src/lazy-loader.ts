import { KaitaiStream } from "kaitai-struct/KaitaiStream";
// const { KaitaiStream } = await import("kaitai-struct/KaitaiStream");
/**
 * Converts a ksy file path to the corresponding dist module path
 * @param ksyPath - The path from the manifest (e.g., "3d/gltf_binary.ksy")
 * @returns The module path for dynamic import (e.g., "../dist/3d/GltfBinary")
 */
function ksyPathToModulePath(ksyPath: string): string {
  // Remove .ksy extension
  const withoutExt = ksyPath.replace(/\.ksy$/, "");

  // Split into directory and filename
  const parts = withoutExt.split("/");
  const filename = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join("/");

  // Convert snake_case to PascalCase
  const pascalCase = filename
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  // Construct the module path
  const modulePath = dir
    ? `../dist/${dir}/${pascalCase}`
    : `../dist/${pascalCase}`;

  return modulePath;
}

/**
 * Lazy loads and executes a parser based on template path
 * @param path - The path from the manifest (e.g., "3d/gltf_binary.ksy" or "archive/android_bootldr_asus.ksy")
 * @param buffer - The ArrayBuffer containing the binary data to parse
 * @returns Promise that resolves to the parsed result
 */
export async function parseTemplate(
  path: string,
  buffer: ArrayBuffer
): Promise<unknown> {
  // Convert ksy path to module path
  const modulePath = ksyPathToModulePath(path);

  // Dynamically import the parser module
  let parserModule: { [key: string]: unknown };
  try {
    parserModule = await import(modulePath);
  } catch (error) {
    throw new Error(
      `Failed to load parser module for "${path}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // Import KaitaiStream
  // @ts-expect-error - kaitai-struct doesn't have TypeScript definitions

  // Find the parser class in the module
  // Kaitai Struct parsers export a class that takes a KaitaiStream in the constructor
  const ParserClass = Object.values(parserModule).find((exported) => {
    // Check if it's a class (function with prototype)
    return typeof exported === "function" && exported.prototype;
  }) as new (io: unknown, parent: unknown, root: unknown) =>
    | unknown
    | undefined;

  if (!ParserClass) {
    throw new Error(
      `Parser module for "${path}" does not export a parser class`
    );
  }

  // Create a KaitaiStream from the buffer
  const stream = new KaitaiStream(buffer);

  // Instantiate the parser with the stream
  // Kaitai parsers take (stream, parent, root) where parent and root are typically null for top-level
  return new ParserClass(stream, null, null);
}
