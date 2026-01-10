import { rename, readdir, writeFile, access, mkdir } from "fs/promises";
import { join, dirname, basename } from "path";
import { execSync } from "child_process";
import { constants } from "fs";
import {
  packageRoot,
  ksyDir,
  generatedDir,
  snakeCaseToPascalCase,
  convertToESM,
  flattenManifest,
  loadManifest,
  parseKsyFile,
} from "./common.js";

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
        // File exists, skip it
        console.log(`⏭ Skipping ${entry.path} (already built)`);

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
        const ksy = await parseKsyFile(inputPath);
        await convertToESM(
          targetFile,
          `export const spec = ${JSON.stringify(ksy, null, 2)};`
        );

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
