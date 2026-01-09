/**
 * Template name to parser module path mapping
 * Maps template names to their corresponding parser module paths
 */
const TEMPLATE_MAP: Record<string, () => Promise<{ [key: string]: (buffer: ArrayBuffer) => unknown }>> = {
  id3v2: () => import("./parsers/id3v2"),
  // Add more templates here as they are added
};

/**
 * Lazy loads and executes a parser based on template name
 * @param name - The name of the template (e.g., "id3v2")
 * @param buffer - The ArrayBuffer containing the binary data to parse
 * @returns Promise that resolves to the parsed result
 */
export async function parseTemplate(
  name: string,
  buffer: ArrayBuffer
): Promise<unknown> {
  const parserLoader = TEMPLATE_MAP[name];
  
  if (!parserLoader) {
    throw new Error(
      `Unknown template: ${name}. Available templates: ${Object.keys(TEMPLATE_MAP).join(", ")}`
    );
  }

  // Dynamically import the parser module
  const parserModule = await parserLoader();
  
  // Find the parse function in the module
  // Parser modules export functions like parseId3, parseXxx, etc.
  const parseFunction = Object.values(parserModule).find(
    (exported) => typeof exported === "function"
  ) as ((buffer: ArrayBuffer) => unknown) | undefined;

  if (!parseFunction) {
    throw new Error(
      `Parser module for "${name}" does not export a parse function`
    );
  }

  // Execute the parse function
  return parseFunction(buffer);
}
