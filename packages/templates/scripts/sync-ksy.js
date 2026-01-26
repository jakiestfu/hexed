import { readdir, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";
import {
  packageRoot,
  ksyDir,
  findKsyFiles,
  copyFoldersWithKsy,
  parseKsyFile,
  buildNestedManifest,
  generateExportPathsFromManifest,
  updatePackageJsonExports,
  generateJsonManifest,
} from "./common.js";

const repoUrl = "https://github.com/kaitai-io/kaitai_struct_formats.git";

async function syncKsyFiles() {
  const tempDir = join(tmpdir(), `kaitai_struct_formats_${Date.now()}`);
  const clonedRepoDir = join(tempDir, "kaitai_struct_formats");
  let hadError = false;

  // ANSI escape codes for styling
  const dim = "\x1b[2m"
  const reset = "\x1b[0m"

  try {
    console.log("🔄 Syncing KSY files...")
    console.log(`${dim}  Cloning repository...${reset}`)
    execSync(`git clone --depth 1 ${repoUrl} "${clonedRepoDir}"`, {
      stdio: "ignore",
    })

    console.log(`${dim}  Finding .ksy files...${reset}`)
    const { ksyFiles, foldersWithKsy } = await findKsyFiles(clonedRepoDir)

    if (ksyFiles.length === 0) {
      console.log("No .ksy files found in the repository.")
      return
    }

    console.log(`${dim}  Found ${ksyFiles.length} file(s) in ${foldersWithKsy.size} folder(s)${reset}`)

    // Ensure target directory exists
    await mkdir(ksyDir, { recursive: true })

    // Clear existing ksy files and old manifest files
    console.log(`${dim}  Clearing existing files...${reset}`)
    const existingEntries = await readdir(ksyDir, { withFileTypes: true })
    for (const entry of existingEntries) {
      const fullPath = join(ksyDir, entry.name)
      if (entry.isDirectory()) {
        await rm(fullPath, { recursive: true, force: true })
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ksy") || entry.name === "manifest.json")
      ) {
        await rm(fullPath, { force: true })
      }
    }

    // Copy folders containing .ksy files
    console.log(`${dim}  Copying files...${reset}`)
    await copyFoldersWithKsy(clonedRepoDir, ksyDir, ksyFiles)

    // Parse all .ksy files and generate manifest
    console.log(`${dim}  Parsing files and generating manifest...${reset}`)
    const formatEntries = []

    for (const ksyFile of ksyFiles) {
      const targetPath = join(ksyDir, ksyFile.relativePath)
      const metadata = await parseKsyFile(targetPath)

      formatEntries.push({
        format: metadata.id,
        title: metadata.title,
        path: ksyFile.relativePath,
        extension: metadata.ksy.meta?.["file-extension"],
      })
    }

    // Sort by path to maintain consistent order
    formatEntries.sort((a, b) => a.path.localeCompare(b.path))

    // Build nested array structure from paths
    const manifest = buildNestedManifest(formatEntries)

    // Generate JSON manifest file
    const manifestPath = join(ksyDir, "manifest.json")
    const manifestContent = generateJsonManifest(manifest)
    await writeFile(manifestPath, manifestContent, "utf-8")

    // Generate and update package.json exports
    console.log(`${dim}  Updating package.json exports...${reset}`)
    const exportEntries = generateExportPathsFromManifest(formatEntries)
    await updatePackageJsonExports(exportEntries)

    console.log(`✓ Synced ${ksyFiles.length} .ksy files`)
    console.log(`✓ Generated manifest.json`)
    console.log(`✓ Updated ${exportEntries.length} package.json export(s)`)
  } catch (error) {
    console.error("Error syncing .ksy files:", error);
    hadError = true;
  } finally {
    // Always clean up temp directory, even on failure
    try {
      const dim = "\x1b[2m"
      const reset = "\x1b[0m"
      console.log(`${dim}  Cleaning up...${reset}`)
      await rm(tempDir, { recursive: true, force: true })
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
