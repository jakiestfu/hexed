import {
  readFile,
  mkdir,
  rename,
  readdir,
  writeFile,
  access,
} from "fs/promises";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { constants } from "fs";
import { transform } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");
const ksyDir = join(packageRoot, "src", "ksy");
const generatedDir = join(packageRoot, "src", "generated");
const manifestPath = join(ksyDir, "manifest.ts");

/**
 * Converts snake_case filename to PascalCase (to find compiler output)
 */
function snakeCaseToPascalCase(filename) {
  return filename
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Checks if a file is CommonJS/UMD format (needs conversion to ESM)
 */
function isCommonJS(content) {
  // Check for CommonJS/UMD patterns
  return (
    content.includes("typeof exports") ||
    content.includes("typeof define") ||
    content.includes("require(") ||
    content.includes("module.exports")
  );
}

/**
 * Converts a CommonJS/UMD file to ESM format using esbuild
 */
async function convertToESM(filePath) {
  try {
    let content = await readFile(filePath, "utf-8");

    // Skip if already ESM
    if (!isCommonJS(content)) {
      return;
    }

    // Check if file has require() calls for kaitai-struct
    const requirePattern = /require\(["']kaitai-struct\/KaitaiStream["']\)/g;
    const hasRequire = requirePattern.test(content);

    // Convert CommonJS/UMD to ESM using esbuild
    // Let esbuild try to convert require() calls, but we'll handle any it misses
    const result = await transform(content, {
      format: "esm",
      target: "es2020",
      loader: "js",
      platform: "neutral",
    });

    let convertedCode = result.code;

    // Post-process: Always check for and replace require() calls
    // esbuild may not convert all require() calls, especially in UMD wrappers
    const kaitaiRequirePattern =
      /require\(["']kaitai-struct\/KaitaiStream["']\)/g;
    const hasKaitaiRequire = kaitaiRequirePattern.test(convertedCode);

    if (hasRequire || hasKaitaiRequire) {
      // Add import statement at the top if it doesn't exist
      const importStatement = `import { KaitaiStream } from "kaitai-struct/KaitaiStream";\n`;
      const hasImport =
        /import\s+.*?\s+from\s+["']kaitai-struct\/KaitaiStream["']/.test(
          convertedCode
        );

      if (!hasImport) {
        // Find where to insert - after header comments
        const headerCommentMatch = convertedCode.match(/^(\/\/[^\n]*\n)*/);
        if (headerCommentMatch) {
          const header = headerCommentMatch[0];
          const rest = convertedCode.slice(header.length);
          convertedCode = header + importStatement + rest;
        } else {
          convertedCode = importStatement + convertedCode;
        }
      }

      // CRITICAL: Replace ALL require() calls for kaitai-struct/KaitaiStream
      // Do this multiple times to catch all instances
      let previousCode = "";
      while (previousCode !== convertedCode) {
        previousCode = convertedCode;
        convertedCode = convertedCode.replace(
          kaitaiRequirePattern,
          "KaitaiStream"
        );
      }
    }

    // Final safety check: ensure no require() calls for kaitai-struct remain
    const finalKaitaiRequires = convertedCode.match(
      /require\(["']kaitai-struct\/KaitaiStream["']\)/g
    );
    if (finalKaitaiRequires && finalKaitaiRequires.length > 0) {
      // Force replace one more time
      convertedCode = convertedCode.replace(
        kaitaiRequirePattern,
        "KaitaiStream"
      );
      console.warn(
        `  ⚠ Warning: Had to force-replace ${finalKaitaiRequires.length} require() call(s)`
      );
    }

    // Check for any other require() calls (non-kaitai)
    const otherRequires = convertedCode.match(
      /require\(["'](?!kaitai-struct\/KaitaiStream)([^"']+)["']\)/g
    );
    if (otherRequires && otherRequires.length > 0) {
      console.warn(
        `  ⚠ Warning: Found other require() calls: ${otherRequires.join(", ")}`
      );
    }

    await writeFile(filePath, convertedCode, "utf-8");
    console.log(`  ↻ Converted to ESM`);
  } catch (error) {
    console.error(`  ✗ Failed to convert ${filePath} to ESM:`, error.message);
    throw error;
  }
}

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

    // Track compiled templates for generating templates.ts
    const compiledTemplates = [];

    // Compile each .ksy file from the manifest
    for (const entry of formatEntries) {
      const inputPath = join(ksyDir, entry.path);
      const outputSubDir = dirname(entry.path);
      const outputDir =
        outputSubDir !== "." ? join(generatedDir, outputSubDir) : generatedDir;

      // Ensure output subdirectory exists
      await mkdir(outputDir, { recursive: true });

      // Check if file already exists
      const originalFilename = basename(entry.path, ".ksy");
      const targetFile = join(outputDir, `${originalFilename}.js`);

      try {
        await access(targetFile, constants.F_OK);
        // File exists, check if it needs conversion to ESM
        console.log(`⏭ Skipping ${entry.path} (already built)`);

        // Check if file is still CommonJS and convert if needed
        try {
          await convertToESM(targetFile);
        } catch (error) {
          console.warn(
            `  ⚠ Warning: Could not convert existing file to ESM: ${error.message}`
          );
        }

        // Still track it for templates.ts generation
        const className = snakeCaseToPascalCase(originalFilename);
        const jsPath = entry.path.replace(/\.ksy$/, ".js");
        compiledTemplates.push({
          ksyPath: entry.path,
          className,
          importPath: `./generated/${jsPath}`,
        });
        continue;
      } catch {
        // File doesn't exist, proceed with compilation
      }

      console.log(`Compiling ${entry.path}...`);

      try {
        // Run kaitai-struct-compiler
        // -t javascript: generate javascript
        // Output directory maintains folder structure
        execSync(
          `kaitai-struct-compiler -t javascript "${inputPath}" --outdir "${outputDir}"`,
          { stdio: "inherit", cwd: packageRoot }
        );

        // Rename the output file to match the original ksy filename
        const pascalCaseFilename = snakeCaseToPascalCase(originalFilename);
        const generatedFile = join(outputDir, `${pascalCaseFilename}.js`);

        // Check if the PascalCase file exists and rename it
        try {
          await rename(generatedFile, targetFile);
        } catch (renameError) {
          // If rename fails, check if file already has correct name or doesn't exist
          const files = await readdir(outputDir);
          const hasPascalCase = files.includes(`${pascalCaseFilename}.js`);
          const hasOriginal = files.includes(`${originalFilename}.js`);

          if (hasPascalCase && !hasOriginal) {
            // File exists with PascalCase name but rename failed
            throw new Error(
              `Failed to rename ${pascalCaseFilename}.js to ${originalFilename}.js: ${renameError.message}`
            );
          } else if (!hasPascalCase && !hasOriginal) {
            // File doesn't exist - compiler may have used a different name
            // Try to find any .js file in the directory
            const jsFiles = files.filter((f) => f.endsWith(".js"));
            if (jsFiles.length === 1) {
              // Only one JS file, rename it
              await rename(join(outputDir, jsFiles[0]), targetFile);
            } else {
              throw new Error(
                `Could not determine output filename. Found: ${jsFiles.join(
                  ", "
                )}`
              );
            }
          }
          // If hasOriginal is true, file already has correct name, no action needed
        }

        // Convert CommonJS/UMD to ESM
        await convertToESM(targetFile);

        // Track this template for templates.ts generation
        const className = snakeCaseToPascalCase(originalFilename);
        const jsPath = entry.path.replace(/\.ksy$/, ".js");
        compiledTemplates.push({
          ksyPath: entry.path,
          className,
          importPath: `./generated/${jsPath}`,
        });

        console.log(`✓ Successfully compiled ${entry.format}`);
      } catch (error) {
        console.error(`✗ Failed to compile ${entry.format}:`, error.message);
        process.exit(1);
      }
    }

    console.log("All .ksy files compiled successfully!");

    // Generate templates.ts file
    console.log("Generating templates.ts...");
    await generateTemplatesFile(compiledTemplates);
    console.log("✓ Generated templates.ts");
  } catch (error) {
    console.error("Error building .ksy files:", error);
    process.exit(1);
  }
}

/**
 * Generates templates.ts file with lazy-loading imports for all compiled templates
 * @param templates - Array of template info with ksyPath, className, and importPath
 */
async function generateTemplatesFile(templates) {
  // Sort templates by ksyPath for consistent output
  templates.sort((a, b) => a.ksyPath.localeCompare(b.ksyPath));

  // Generate export object entries with lazy import functions
  const exportEntries = templates
    .map(
      (template) =>
        `  "${template.ksyPath}": () => import("${template.importPath}")`
    )
    .join(",\n");

  const templatesContent = `/**
 * Template registry mapping ksy file paths to lazy-loading functions for their compiled parser classes.
 * This file is auto-generated by build-ksy.js - do not edit manually.
 */

export default {
${exportEntries}
};
`;

  const templatesPath = join(packageRoot, "src", "templates.ts");
  await writeFile(templatesPath, templatesContent, "utf-8");
}

buildKsyFiles();
