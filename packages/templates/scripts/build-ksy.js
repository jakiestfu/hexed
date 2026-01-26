import { execSync } from "child_process"
import { constants } from "fs"
import { access, mkdir, writeFile } from "fs/promises"
import { basename, dirname, join } from "path"

import {
  convertKsyPathToPascalCaseJsPath,
  convertToESM,
  flattenManifest,
  generatedDir,
  ksyDir,
  loadManifest,
  packageRoot,
  parseKsyFile,
  snakeCaseToPascalCase
} from "./common.js"

async function buildKsyFiles() {
  try {
    // Load manifest from TypeScript file
    let manifest
    try {
      manifest = await loadManifest()
    } catch (error) {
      console.error(error.message)
      process.exit(1)
    }

    if (!Array.isArray(manifest) || manifest.length === 0) {
      console.log("No formats found in manifest")
      return
    }

    // Flatten the nested structure to get all format entries
    const formatEntries = flattenManifest(manifest)

    if (formatEntries.length === 0) {
      console.log("No format entries found in manifest")
      return
    }

    // ANSI escape codes for styling
    const dim = "\x1b[2m"
    const reset = "\x1b[0m"

    console.log(`🔨 Building ${formatEntries.length} KSY template(s)...`)

    // Ensure generated directory exists
    await mkdir(generatedDir, { recursive: true })

    // Track compiled templates for generating templates.ts
    const compiledTemplates = []
    let compiledCount = 0
    let skippedCount = 0

    // Compile each .ksy file from the manifest
    for (let i = 0; i < formatEntries.length; i++) {
      const entry = formatEntries[i]
      const inputPath = join(ksyDir, entry.path)
      const outputSubDir = dirname(entry.path)
      const outputDir =
        outputSubDir !== "." ? join(generatedDir, outputSubDir) : generatedDir

      // Ensure output subdirectory exists
      await mkdir(outputDir, { recursive: true })

      // Check if file already exists (using PascalCase filename)
      const originalFilename = basename(entry.path, ".ksy")
      const pascalCaseFilename = snakeCaseToPascalCase(originalFilename)
      const targetFile = join(outputDir, `${pascalCaseFilename}.js`)

      try {
        await access(targetFile, constants.F_OK)
        // File exists, skip it
        skippedCount++

        // Still track it for templates.ts generation
        const className = pascalCaseFilename
        const jsPath = convertKsyPathToPascalCaseJsPath(entry.path)
        compiledTemplates.push({
          ksyPath: entry.path,
          className,
          importPath: `./generated/${jsPath}`
        })
        continue
      } catch {
        // File doesn't exist, proceed with compilation
      }

      compiledCount++
      const progress = `[${compiledCount + skippedCount}/${formatEntries.length}]`
      console.log(`${progress} ${entry.path}`)

      try {
        // Run kaitai-struct-compiler
        // -t javascript: generate javascript
        // --import-path: specify where to find imported ksy files
        // Output directory maintains folder structure
        // The compiler generates PascalCase filenames, which we keep
        execSync(
          `kaitai-struct-compiler --read-pos -t javascript --import-path "${ksyDir}" "${inputPath}" --outdir "${outputDir}"`,
          { stdio: "ignore", cwd: packageRoot }
        )

        // Convert CommonJS/UMD to ESM
        // targetFile already uses PascalCase filename
        const ksy = await parseKsyFile(inputPath)
        await convertToESM(
          targetFile,
          `export const spec = ${JSON.stringify(ksy, null, 2)};`
        )

        // Track this template for templates.ts generation
        const className = pascalCaseFilename
        const jsPath = convertKsyPathToPascalCaseJsPath(entry.path)
        compiledTemplates.push({
          ksyPath: entry.path,
          className,
          importPath: `./generated/${jsPath}`
        })
      } catch (error) {
        console.error(`✗ Failed to compile ${entry.format}:`, error.message)
        process.exit(1)
      }
    }

    console.log(`✓ Compiled ${compiledCount} template(s)${skippedCount > 0 ? `, skipped ${skippedCount}` : ""}`)

    // Generate templates.ts file
    console.log(`${dim}  Generating templates.ts...${reset}`)
    await generateTemplatesFile(compiledTemplates)
    console.log(`✓ Generated templates.ts`)
  } catch (error) {
    console.error("Error building .ksy files:", error)
    process.exit(1)
  }
}

/**
 * Generates templates.ts file with lazy-loading imports for all compiled templates
 * @param templates - Array of template info with ksyPath, className, and importPath
 */
async function generateTemplatesFile(templates) {
  // Sort templates by ksyPath for consistent output
  templates.sort((a, b) => a.ksyPath.localeCompare(b.ksyPath))

  // Generate export object entries with lazy import functions
  const exportEntries = templates
    .map(
      (template) =>
        `  "${template.ksyPath}": () => import("${template.importPath}")`
    )
    .join(",\n")

  const templatesContent = `
// @ts-nocheck
/**
 * Template registry mapping ksy file paths to lazy-loading functions for their compiled parser classes.
 * This file is auto-generated by build-ksy.js - do not edit manually.
 */

export default {
${exportEntries}
};
`

  const templatesPath = join(packageRoot, "src", "templates.ts")
  await writeFile(templatesPath, templatesContent, "utf-8")
}

buildKsyFiles()
