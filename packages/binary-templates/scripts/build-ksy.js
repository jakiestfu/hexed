import { readFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");
const ksyDir = join(packageRoot, "src", "ksy");
const generatedDir = join(packageRoot, "dist");
const manifestPath = join(ksyDir, "manifest.ts");

/**
 * Flatten nested manifest structure to extract all format entries with paths
 */
function flattenManifest(manifest) {
  const entries = [];

  function traverse(items) {
    for (const item of items) {
      if ("path" in item && "name" in item && "title" in item) {
        // Leaf node - format entry
        entries.push({
          format: item.name,
          path: item.path,
        });
      } else if ("children" in item) {
        // Branch node - folder
        traverse(item.children);
      }
    }
  }

  traverse(manifest);
  return entries;
}

/**
 * Parse TypeScript manifest file and extract the manifest object
 * Uses tsx to execute TypeScript if available, otherwise falls back to parsing
 */
async function loadManifest() {
  try {
    // Try to use tsx to execute the TypeScript file
    // Check if tsx is available by trying to spawn it
    try {
      const { spawnSync } = await import("child_process");
      const { pathToFileURL } = await import("url");

      // Try importing directly (works if tsx/ts-node is configured)
      const manifestUrl = pathToFileURL(manifestPath).href;
      try {
        const manifestModule = await import(manifestUrl);
        return manifestModule.manifest;
      } catch {
        // If direct import fails, try using tsx via spawn
        const result = spawnSync(
          "npx",
          [
            "-y",
            "tsx",
            "-e",
            `import('${manifestUrl}').then(m => console.log(JSON.stringify(m.manifest)))`,
          ],
          { encoding: "utf-8", cwd: packageRoot }
        );

        if (result.status === 0 && result.stdout) {
          return JSON.parse(result.stdout.trim());
        }
      }
    } catch {
      // tsx not available, fall back to reading and parsing
    }

    // Fallback: Read the file and extract structure
    // This is a simple approach that works for the generated structure
    const manifestContent = await readFile(manifestPath, "utf-8");

    // Extract the manifest array - look for the export const manifest = [...] pattern
    // We'll use a regex to find the array structure
    const arrayStart = manifestContent.indexOf("export const manifest");
    if (arrayStart === -1) {
      throw new Error("Could not find manifest export");
    }

    // Find the opening bracket after the equals sign
    let bracketPos = manifestContent.indexOf("[", arrayStart);
    if (bracketPos === -1) {
      throw new Error("Could not find manifest array");
    }

    // Find matching closing bracket
    let depth = 0;
    let pos = bracketPos;
    let inString = false;
    let stringChar = null;
    let escapeNext = false;

    while (pos < manifestContent.length) {
      const char = manifestContent[pos];

      if (escapeNext) {
        escapeNext = false;
        pos++;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        pos++;
        continue;
      }

      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = null;
      } else if (!inString) {
        if (char === "[") depth++;
        if (char === "]") {
          depth--;
          if (depth === 0) {
            // Found the closing bracket
            const manifestStr = manifestContent.substring(bracketPos, pos + 1);
            // Use Function constructor as safer alternative to eval
            const manifest = new Function(`return ${manifestStr}`)();
            return manifest;
          }
        }
      }
      pos++;
    }

    throw new Error("Could not parse manifest structure");
  } catch (error) {
    throw new Error(
      `Error reading manifest.ts: ${error.message}\n` +
        "Please run 'pnpm sync:ksy' first to generate the manifest.\n" +
        "Note: For best results, install tsx: pnpm add -D tsx"
    );
  }
}

async function buildKsyFiles() {
  try {
    // Load manifest from TypeScript file
    let manifest;
    try {
      manifest = await loadManifest();
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }

    if (!Array.isArray(manifest) || manifest.length === 0) {
      console.log("No formats found in manifest");
      return;
    }

    // Flatten the nested structure to get all format entries
    const formatEntries = flattenManifest(manifest);

    if (formatEntries.length === 0) {
      console.log("No format entries found in manifest");
      return;
    }

    console.log(`Found ${formatEntries.length} format(s) to compile`);

    // Ensure generated directory exists
    await mkdir(generatedDir, { recursive: true });

    // Compile each .ksy file from the manifest
    for (const entry of formatEntries) {
      const inputPath = join(ksyDir, entry.path);
      const outputSubDir = dirname(entry.path);
      const outputDir =
        outputSubDir !== "." ? join(generatedDir, outputSubDir) : generatedDir;

      // Ensure output subdirectory exists
      await mkdir(outputDir, { recursive: true });

      console.log(`Compiling ${entry.path}...`);

      try {
        // Run kaitai-struct-compiler
        // -t javascript: generate javascript
        // Output directory maintains folder structure
        execSync(
          `kaitai-struct-compiler -t javascript "${inputPath}" --outdir "${outputDir}"`,
          { stdio: "inherit", cwd: packageRoot }
        );
        console.log(`✓ Successfully compiled ${entry.format}`);
      } catch (error) {
        console.error(`✗ Failed to compile ${entry.format}:`, error.message);
        process.exit(1);
      }
    }

    console.log("All .ksy files compiled successfully!");
  } catch (error) {
    console.error("Error building .ksy files:", error);
    process.exit(1);
  }
}

buildKsyFiles();
