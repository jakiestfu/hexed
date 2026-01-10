import { readdir, readFile, mkdir, cp, rm, writeFile } from "fs/promises";
import { join, dirname, relative, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");
const ksyDir = join(packageRoot, "src", "ksy");
const repoUrl = "https://github.com/kaitai-io/kaitai_struct_formats.git";

async function findKsyFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const ksyFiles = [];
  const foldersWithKsy = new Set();

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip .git directory
    if (entry.name === ".git") {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const { ksyFiles: subKsyFiles, foldersWithKsy: subFolders } =
        await findKsyFiles(fullPath, baseDir);
      ksyFiles.push(...subKsyFiles);
      // Merge folders sets
      for (const folder of subFolders) {
        foldersWithKsy.add(folder);
      }
    } else if (entry.isFile() && entry.name.endsWith(".ksy")) {
      const relativePath = relative(baseDir, fullPath);
      ksyFiles.push({
        fullPath,
        relativePath,
        category: relative(baseDir, dirname(fullPath)) || "root",
      });
      // Track the folder containing this .ksy file
      foldersWithKsy.add(dirname(fullPath));
    }
  }

  return { ksyFiles, foldersWithKsy };
}

async function copyFoldersWithKsy(sourceDir, targetDir, ksyFiles) {
  // Group ksy files by their directory structure
  const dirsToCopy = new Map();

  for (const ksyFile of ksyFiles) {
    const dir = dirname(ksyFile.fullPath);
    const relativeDir = relative(sourceDir, dir);

    if (!dirsToCopy.has(relativeDir)) {
      dirsToCopy.set(relativeDir, []);
    }
    dirsToCopy.get(relativeDir).push(ksyFile);
  }

  // Copy each directory's .ksy files
  for (const [relativeDir, files] of dirsToCopy) {
    const targetFolder = join(targetDir, relativeDir);
    await mkdir(targetFolder, { recursive: true });

    for (const ksyFile of files) {
      const targetFile = join(targetFolder, basename(ksyFile.fullPath));
      await cp(ksyFile.fullPath, targetFile);
    }
  }
}

async function parseKsyFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const doc = yaml.load(content);

    if (doc && doc.meta) {
      return {
        id: doc.meta.id || basename(filePath, ".ksy"),
        title: doc.meta.title || basename(filePath, ".ksy"),
      };
    }

    // Fallback to filename if no meta section
    return {
      id: basename(filePath, ".ksy"),
      title: basename(filePath, ".ksy"),
    };
  } catch (error) {
    console.warn(`Warning: Failed to parse ${filePath}:`, error.message);
    return {
      id: basename(filePath, ".ksy"),
      title: basename(filePath, ".ksy"),
    };
  }
}

function buildNestedManifest(formatEntries) {
  // Build a tree structure from paths
  const tree = {};

  for (const entry of formatEntries) {
    const pathParts = entry.path.split("/");
    const fileName = pathParts.pop().replace(".ksy", "");
    const folderPath = pathParts;

    // Navigate/create tree structure
    let current = tree;
    for (const part of folderPath) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    // Add the format entry
    if (!current[fileName]) {
      current[fileName] = [];
    }
    current[fileName].push({
      name: entry.format,
      title: entry.title,
      path: entry.path,
    });
  }

  // Convert tree to nested array structure
  function treeToArray(node, name = null) {
    const result = [];

    // Collect all entries (leaf nodes)
    const entries = [];
    // Collect all folders (branch nodes)
    const folders = [];

    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        // This is a leaf node with format entries
        entries.push(...value);
      } else {
        // This is a folder
        folders.push({ name: key, node: value });
      }
    }

    // Sort entries by name
    entries.sort((a, b) => a.name.localeCompare(b.name));

    // Sort folders by name
    folders.sort((a, b) => a.name.localeCompare(b.name));

    // Add entries first, then folders
    result.push(...entries);
    for (const folder of folders) {
      const children = treeToArray(folder.node);
      if (children.length > 0) {
        result.push({
          name: folder.name,
          children,
        });
      }
    }

    return result;
  }

  return treeToArray(tree);
}

/**
 * Converts a ksy file path to export path entries
 * Preserves the original path structure without renaming or case conversion
 * @param ksyPath - The path from the manifest (e.g., "3d/gltf_binary.ksy")
 * @returns Object with export key and value
 */
function ksyPathToExportPath(ksyPath) {
  // Remove .ksy extension and keep original path structure
  const jsPath = ksyPath.replace(/\.ksy$/, ".js");

  // Export key and value are the same: ./dist prefix + original path with .js
  const exportPath = `./dist/${jsPath}`;

  return { key: `./${jsPath}`, value: exportPath };
}

/**
 * Generates export paths from manifest format entries
 * @param formatEntries - Array of format entries with path field
 * @returns Array of export entries with key and value
 */
function generateExportPathsFromManifest(formatEntries) {
  return formatEntries.map((entry) => ksyPathToExportPath(entry.path));
}

/**
 * Updates package.json exports field
 * Preserves only "." and "./manifest" exports, then adds all new exports
 * @param exports - Array of export entries with key and value
 */
async function updatePackageJsonExports(exports) {
  const packageJsonPath = join(packageRoot, "package.json");
  const packageJsonContent = await readFile(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageJsonContent);

  // Preserve only "." and "./manifest" exports
  const preservedExports = {};
  if (packageJson.exports?.["."]) {
    preservedExports["."] = packageJson.exports["."];
  }
  if (packageJson.exports?.["./manifest"]) {
    preservedExports["./manifest"] = packageJson.exports["./manifest"];
  }

  // Add all new exports
  const newExports = {};
  for (const exportEntry of exports) {
    newExports[exportEntry.key] = exportEntry.value;
  }

  // Merge and sort exports alphabetically
  const allExports = { ...preservedExports, ...newExports };
  const sortedKeys = Object.keys(allExports).sort((a, b) => {
    // Keep "." first, then "./manifest", then sort the rest
    if (a === ".") return -1;
    if (b === ".") return 1;
    if (a === "./manifest") return -1;
    if (b === "./manifest") return 1;
    return a.localeCompare(b);
  });

  const sortedExports = {};
  for (const key of sortedKeys) {
    sortedExports[key] = allExports[key];
  }

  packageJson.exports = sortedExports;

  // Write updated package.json
  await writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );
}

function generateTypeScriptManifest(manifest) {
  function formatValue(value, indent = 0) {
    const indentStr = "  ".repeat(indent);

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "[]";
      }
      const items = value
        .map((item) => formatValue(item, indent + 1))
        .join(",\n");
      return `[\n${items}\n${indentStr}]`;
    }

    if (typeof value === "object" && value !== null) {
      if ("name" in value && "title" in value && "path" in value) {
        // Leaf node (format entry)
        return `${indentStr}{\n${indentStr}  name: ${JSON.stringify(
          value.name
        )},\n${indentStr}  title: ${JSON.stringify(
          value.title
        )},\n${indentStr}  path: ${JSON.stringify(value.path)},\n${indentStr}}`;
      } else if ("name" in value && "children" in value) {
        // Branch node (folder)
        return `${indentStr}{\n${indentStr}  name: ${JSON.stringify(
          value.name
        )},\n${indentStr}  children: ${formatValue(
          value.children,
          indent + 1
        )},\n${indentStr}}`;
      }
    }

    return JSON.stringify(value);
  }

  const manifestStr = formatValue(manifest, 1);

  return `/**
 * Manifest of all available Kaitai Struct format definitions.
 * This file is auto-generated by sync-ksy.js - do not edit manually.
 */

export type ManifestEntry =
  | {
      name: string;
      title: string;
      path: string;
    }
  | {
      name: string;
      children: ManifestEntry[];
    };

export const manifest = ${manifestStr} as const satisfies ManifestEntry[];

/**
 * Helper type to extract template IDs from nested manifest structure
 */
type ExtractTemplateIds<T> = T extends readonly (infer U)[]
  ? U extends { name: string; title: string; path: string }
    ? U["name"]
    : U extends { name: string; children: infer C }
    ? ExtractTemplateIds<C>
    : never
  : never;

/**
 * Union type of all valid template ID strings
 */
export type TemplateId = ExtractTemplateIds<typeof manifest>;
`;
}

async function syncKsyFiles() {
  const tempDir = join(tmpdir(), `kaitai_struct_formats_${Date.now()}`);
  const clonedRepoDir = join(tempDir, "kaitai_struct_formats");
  let hadError = false;

  try {
    console.log("Cloning kaitai_struct_formats repository...");
    execSync(`git clone --depth 1 ${repoUrl} "${clonedRepoDir}"`, {
      stdio: "inherit",
    });

    console.log("Finding all .ksy files...");
    const { ksyFiles, foldersWithKsy } = await findKsyFiles(clonedRepoDir);

    if (ksyFiles.length === 0) {
      console.log("No .ksy files found in the repository.");
      return;
    }

    console.log(
      `Found ${ksyFiles.length} .ksy file(s) in ${foldersWithKsy.size} folder(s)`
    );

    // Ensure target directory exists
    await mkdir(ksyDir, { recursive: true });

    // Clear existing ksy files and old manifest files
    console.log("Clearing existing .ksy files...");
    const existingEntries = await readdir(ksyDir, { withFileTypes: true });
    for (const entry of existingEntries) {
      const fullPath = join(ksyDir, entry.name);
      if (entry.isDirectory()) {
        await rm(fullPath, { recursive: true, force: true });
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ksy") ||
          entry.name === "manifest.json" ||
          entry.name === "manifest.ts")
      ) {
        await rm(fullPath, { force: true });
      }
    }

    // Copy folders containing .ksy files
    console.log("Copying folders with .ksy files...");
    await copyFoldersWithKsy(clonedRepoDir, ksyDir, ksyFiles);

    // Parse all .ksy files and generate manifest
    console.log("Parsing .ksy files and generating manifest...");
    const formatEntries = [];

    for (const ksyFile of ksyFiles) {
      const targetPath = join(ksyDir, ksyFile.relativePath);
      const metadata = await parseKsyFile(targetPath);

      formatEntries.push({
        format: metadata.id,
        title: metadata.title,
        path: ksyFile.relativePath,
      });
    }

    // Sort by path to maintain consistent order
    formatEntries.sort((a, b) => a.path.localeCompare(b.path));

    // Build nested array structure from paths
    const manifest = buildNestedManifest(formatEntries);

    // Generate TypeScript manifest file
    const manifestPath = join(ksyDir, "manifest.ts");
    const manifestContent = generateTypeScriptManifest(manifest);
    await writeFile(manifestPath, manifestContent, "utf-8");

    // Generate and update package.json exports
    console.log("Updating package.json exports...");
    const exportEntries = generateExportPathsFromManifest(formatEntries);
    await updatePackageJsonExports(exportEntries);

    console.log(`✓ Successfully synced ${ksyFiles.length} .ksy files`);
    console.log(`✓ Generated manifest.ts with nested structure`);
    console.log(`✓ Manifest written to ${manifestPath}`);
    console.log(
      `✓ Updated package.json with ${exportEntries.length} export(s)`
    );
  } catch (error) {
    console.error("Error syncing .ksy files:", error);
    hadError = true;
  } finally {
    // Always clean up temp directory, even on failure
    try {
      console.log("Cleaning up temporary files...");
      await rm(tempDir, { recursive: true, force: true });
      console.log("✓ Cleanup complete");
    } catch (cleanupError) {
      // Ignore errors if directory doesn't exist (ENOENT)
      if (cleanupError.code !== "ENOENT") {
        console.error(
          `Warning: Failed to clean up temp directory ${tempDir}:`,
          cleanupError.message
        );
      }
    }

    // Exit with error code if there was an error
    if (hadError) {
      process.exit(1);
    }
  }
}

syncKsyFiles().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
