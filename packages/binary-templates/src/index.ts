export * from "./ksy/manifest";
import templates from "./templates";

// const allImports = await import("./generated/3d/gltf_binary.js");
// console.log({ test });
/**
 * Loads a parser class by its ksy file path
 * @param path - The ksy file path (e.g., "3d/gltf_binary.ksy")
 * @returns Promise that resolves to the parser class constructor
 * @throws Error if the path is not found in the templates registry
 */
export async function load(
  path: string
): Promise<new (io: unknown, parent: unknown, root: unknown) => unknown> {
  const importFn = templates[path as keyof typeof templates];

  console.log({ path, templates });

  if (!importFn) {
    const availablePaths = Object.keys(templates).join(", ");
    throw new Error(
      `No parser found for path "${path}". Available paths: ${availablePaths}`
    );
  }

  // Call the lazy import function
  const parserModule = await importFn();
  console.log({
    def: parserModule.default,
    GltfBinary: parserModule.GltfBinary,
    v: Object.values(parserModule),
    k: Object.keys(parserModule),
  });
  // Find the parser class in the module
  // Kaitai Struct parsers export a class that takes a KaitaiStream in the constructor
  // Check default export first, then look through all exports
  let ParserClass: new (io: unknown, parent: unknown, root: unknown) =>
    | unknown
    | undefined;

  if (
    parserModule.default &&
    typeof parserModule.default === "function" &&
    parserModule.default.prototype
  ) {
    ParserClass = parserModule.default as new (
      io: unknown,
      parent: unknown,
      root: unknown
    ) => unknown;
  } else {
    ParserClass = Object.values(parserModule).find((exported) => {
      // Check if it's a class (function with prototype)
      return typeof exported === "function" && exported.prototype;
    }) as new (io: unknown, parent: unknown, root: unknown) =>
      | unknown
      | undefined;
  }

  if (!ParserClass) {
    throw new Error(
      `Parser module for "${path}" does not export a parser class`
    );
  }

  return ParserClass;
}
