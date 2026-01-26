import { cp, mkdir, readdir, readFile, rm, writeFile } from "fs/promises"
import { basename, dirname, join, relative } from "path"
import { fileURLToPath } from "url"
import { transform } from "esbuild"
import yaml from "js-yaml"

// Shared constants
export const __filename = fileURLToPath(import.meta.url)
export const __dirname = dirname(__filename)
export const packageRoot = join(__dirname, "..")
export const ksyDir = join(packageRoot, "src", "ksy")
export const generatedDir = join(packageRoot, "src", "generated")
export const manifestPath = join(ksyDir, "manifest.json")

/**
 * Converts snake_case filename to PascalCase (to find compiler output)
 */
export function snakeCaseToPascalCase(filename) {
  return filename
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

/**
 * Converts a ksy file path to PascalCase JS path for imports
 * Example: "image/exif.ksy" -> "image/Exif.js"
 * @param ksyPath - The path from the manifest (e.g., "image/exif.ksy")
 * @returns The JS path with PascalCase filename (e.g., "image/Exif.js")
 */
export function convertKsyPathToPascalCaseJsPath(ksyPath) {
  const pathParts = ksyPath.split("/")
  const filename = basename(ksyPath, ".ksy")
  const pascalCaseFilename = snakeCaseToPascalCase(filename)
  const dirPath = pathParts.slice(0, -1).join("/")
  
  if (dirPath) {
    return `${dirPath}/${pascalCaseFilename}.js`
  }
  return `${pascalCaseFilename}.js`
}

function patchKsyImports(convertedCode) {
  // Post-process: Always check for and replace require() calls
  // esbuild may not convert all require() calls, especially in UMD wrappers
  const kaitaiRequirePattern = /require\(["']kaitai-struct\/KaitaiStream["']\)/g
  const hasKaitaiRequire = kaitaiRequirePattern.test(convertedCode)
  const hasRequire = /require\(["'][^"']+["']\)/.test(convertedCode)

  if (hasRequire || hasKaitaiRequire) {
    // Add import statement at the top if it doesn't exist
    const importStatement = `import { KaitaiStream } from "kaitai-struct";\n`
    const hasImport = /import\s+.*?\s+from\s+["']kaitai-struct["']/.test(
      convertedCode
    )

    if (!hasImport) {
      // Find where to insert - after header comments
      const headerCommentMatch = convertedCode.match(/^(\/\/[^\n]*\n)*/)
      if (headerCommentMatch) {
        const header = headerCommentMatch[0]
        const rest = convertedCode.slice(header.length)
        convertedCode = header + importStatement + rest
      } else {
        convertedCode = importStatement + convertedCode
      }
    }

    // CRITICAL: Replace ALL require() calls for kaitai-struct/KaitaiStream
    // Do this multiple times to catch all instances
    let previousCode = ""
    while (previousCode !== convertedCode) {
      previousCode = convertedCode
      convertedCode = convertedCode.replace(
        kaitaiRequirePattern,
        "KaitaiStream"
      )
    }
  }

  // Final safety check: ensure no require() calls for kaitai-struct remain
  const finalKaitaiRequires = convertedCode.match(
    /require\(["']kaitai-struct\/KaitaiStream["']\)/g
  )
  if (finalKaitaiRequires && finalKaitaiRequires.length > 0) {
    // Force replace one more time
    convertedCode = convertedCode.replace(kaitaiRequirePattern, "KaitaiStream")
    console.warn(
      `  ⚠ Warning: Had to force-replace ${finalKaitaiRequires.length} require() call(s)`
    )
  }

  // Check for any other require() calls (non-kaitai)
  const otherRequires = convertedCode.match(
    /require\(["'](?!kaitai-struct\/KaitaiStream)([^"']+)["']\)/g
  )
  if (otherRequires && otherRequires.length > 0) {
    console.warn(
      `  ⚠ Warning: Found other require() calls: ${otherRequires.join(", ")}`
    )
  }

  return convertedCode
}

/**
 * Converts a file to ESM format using esbuild
 */
export async function convertToESM(filePath, additionalCode = "") {
  try {
    const content = await readFile(filePath, "utf-8")
    const result = await transform(content, {
      format: "esm",
      target: "es2020",
      loader: "js",
      platform: "neutral"
    })

    const patchedCode = patchKsyImports(result.code)

    await writeFile(
      filePath,
      [patchedCode, additionalCode].filter(Boolean).join("\n"),
      "utf-8"
    )
    const dim = "\x1b[2m"
    const reset = "\x1b[0m"
    console.log(`${dim}  ↻ Converted to ESM${reset}`)
  } catch (error) {
    console.error(`  ✗ Failed to convert ${filePath} to ESM:`, error.message)
    throw error
  }
}

/**
 * Flatten nested manifest structure to extract all format entries with paths
 */
export function flattenManifest(manifest) {
  const entries = []

  function traverse(items) {
    for (const item of items) {
      if ("path" in item && "name" in item && "title" in item) {
        // Leaf node - format entry
        entries.push({
          format: item.name,
          path: item.path
        })
      } else if ("children" in item) {
        // Branch node - folder
        traverse(item.children)
      }
    }
  }

  traverse(manifest)
  return entries
}

/**
 * Load manifest from JSON file
 */
export async function loadManifest() {
  try {
    const manifestContent = await readFile(manifestPath, "utf-8")
    return JSON.parse(manifestContent)
  } catch (error) {
    throw new Error(
      `Error reading manifest.json: ${error.message}\n` +
        "Please run 'pnpm sync:ksy' first to generate the manifest."
    )
  }
}

/**
 * Find all .ksy files in a directory recursively
 */
export async function findKsyFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const ksyFiles = []
  const foldersWithKsy = new Set()

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    // Skip .git directory
    if (entry.name === ".git") {
      continue
    }

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const { ksyFiles: subKsyFiles, foldersWithKsy: subFolders } =
        await findKsyFiles(fullPath, baseDir)
      ksyFiles.push(...subKsyFiles)
      // Merge folders sets
      for (const folder of subFolders) {
        foldersWithKsy.add(folder)
      }
    } else if (entry.isFile() && entry.name.endsWith(".ksy")) {
      const relativePath = relative(baseDir, fullPath)
      ksyFiles.push({
        fullPath,
        relativePath,
        category: relative(baseDir, dirname(fullPath)) || "root"
      })
      // Track the folder containing this .ksy file
      foldersWithKsy.add(dirname(fullPath))
    }
  }

  return { ksyFiles, foldersWithKsy }
}

/**
 * Copy folders containing .ksy files
 */
export async function copyFoldersWithKsy(sourceDir, targetDir, ksyFiles) {
  // Group ksy files by their directory structure
  const dirsToCopy = new Map()

  for (const ksyFile of ksyFiles) {
    const dir = dirname(ksyFile.fullPath)
    const relativeDir = relative(sourceDir, dir)

    if (!dirsToCopy.has(relativeDir)) {
      dirsToCopy.set(relativeDir, [])
    }
    dirsToCopy.get(relativeDir).push(ksyFile)
  }

  // Copy each directory's .ksy files
  for (const [relativeDir, files] of dirsToCopy) {
    const targetFolder = join(targetDir, relativeDir)
    await mkdir(targetFolder, { recursive: true })

    for (const ksyFile of files) {
      const targetFile = join(targetFolder, basename(ksyFile.fullPath))
      await cp(ksyFile.fullPath, targetFile)
    }
  }
}

/**
 * Parse a .ksy file and extract metadata
 */
export async function parseKsyFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8")
    const doc = yaml.load(content)

    if (doc && doc.meta) {
      return {
        id: doc.meta.id || basename(filePath, ".ksy"),
        title: doc.meta.title || basename(filePath, ".ksy"),
        ksy: doc
      }
    }

    // Fallback to filename if no meta section
    return {
      id: basename(filePath, ".ksy"),
      title: basename(filePath, ".ksy"),
      ksy: doc || {}
    }
  } catch (error) {
    console.warn(`Warning: Failed to parse ${filePath}:`, error.message)
    return {
      id: basename(filePath, ".ksy"),
      title: basename(filePath, ".ksy"),
      ksy: {}
    }
  }
}

/**
 * Build nested manifest structure from flat format entries
 */
export function buildNestedManifest(formatEntries) {
  // Build a tree structure from paths
  const tree = {}

  for (const entry of formatEntries) {
    const pathParts = entry.path.split("/")
    const fileName = pathParts.pop().replace(".ksy", "")
    const folderPath = pathParts

    // Navigate/create tree structure
    let current = tree
    for (const part of folderPath) {
      if (!current[part]) {
        current[part] = {}
      }
      current = current[part]
    }

    // Add the format entry
    if (!current[fileName]) {
      current[fileName] = []
    }
    current[fileName].push({
      ...entry,
      name: entry.format
    })
  }

  // Convert tree to nested array structure
  function treeToArray(node, name = null) {
    const result = []

    // Collect all entries (leaf nodes)
    const entries = []
    // Collect all folders (branch nodes)
    const folders = []

    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        // This is a leaf node with format entries
        entries.push(...value)
      } else {
        // This is a folder
        folders.push({ name: key, node: value })
      }
    }

    // Sort entries by name
    entries.sort((a, b) => a.name.localeCompare(b.name))

    // Sort folders by name
    folders.sort((a, b) => a.name.localeCompare(b.name))

    // Add entries first, then folders
    result.push(...entries)
    for (const folder of folders) {
      const children = treeToArray(folder.node)
      if (children.length > 0) {
        result.push({
          name: folder.name,
          children
        })
      }
    }

    return result
  }

  return treeToArray(tree)
}

/**
 * Converts a ksy file path to export path entries
 * Converts filename to PascalCase to match generated JS files
 * @param ksyPath - The path from the manifest (e.g., "3d/gltf_binary.ksy")
 * @returns Object with export key and value
 */
export function ksyPathToExportPath(ksyPath) {
  // Convert to PascalCase JS path
  const jsPath = convertKsyPathToPascalCaseJsPath(ksyPath)
  // Key uses original ksy path without extension
  const key = ksyPath.replace(/\.ksy$/, "")

  return { key: `./${key}`, value: `./src/generated/${jsPath}` }
}

/**
 * Generates export paths from manifest format entries
 * @param formatEntries - Array of format entries with path field
 * @returns Array of export entries with key and value
 */
export function generateExportPathsFromManifest(formatEntries) {
  return formatEntries.map((entry) => ksyPathToExportPath(entry.path))
}

/**
 * Updates package.json exports field
 * Preserves only "." and "./manifest" exports, then adds all new exports
 * @param exports - Array of export entries with key and value
 */
export async function updatePackageJsonExports(exports) {
  const packageJsonPath = join(packageRoot, "package.json")
  const packageJsonContent = await readFile(packageJsonPath, "utf-8")
  const packageJson = JSON.parse(packageJsonContent)

  // Preserve only "." and "./manifest" exports
  const preservedExports = {}
  if (packageJson.exports?.["."]) {
    preservedExports["."] = packageJson.exports["."]
  }
  if (packageJson.exports?.["./manifest"]) {
    preservedExports["./manifest"] = packageJson.exports["./manifest"]
  }

  // Add all new exports
  const newExports = {}
  for (const exportEntry of exports) {
    newExports[exportEntry.key] = exportEntry.value
  }

  // Merge and sort exports alphabetically
  const allExports = { ...preservedExports, ...newExports }
  const sortedKeys = Object.keys(allExports).sort((a, b) => {
    // Keep "." first, then "./manifest", then sort the rest
    if (a === ".") return -1
    if (b === ".") return 1
    if (a === "./manifest") return -1
    if (b === "./manifest") return 1
    return a.localeCompare(b)
  })

  const sortedExports = {}
  for (const key of sortedKeys) {
    sortedExports[key] = allExports[key]
  }

  packageJson.exports = sortedExports

  // Write updated package.json
  await writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  )
}

/**
 * Generate JSON manifest content
 */
export function generateJsonManifest(manifest) {
  return JSON.stringify(manifest, null, 2) + "\n"
}
