export * from "./ksy/manifest";
import templates from "./templates";

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

  try {
    ParserClass = Object.values(Object.values(parserModule)[0])[0] as new (
      io: unknown,
      parent: unknown,
      root: unknown
    ) => unknown;
  } catch (error) {
    throw new Error(
      `Parser module for "${path}" does not export a parser class`
    );
  }

  return ParserClass;
}
