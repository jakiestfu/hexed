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
        (entry.name.endsWith(".ksy") || entry.name === "manifest.json")
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

    // Generate JSON manifest file
    const manifestPath = join(ksyDir, "manifest.json");
    const manifestContent = generateJsonManifest(manifest);
    await writeFile(manifestPath, manifestContent, "utf-8");

    // Generate and update package.json exports
    console.log("Updating package.json exports...");
    const exportEntries = generateExportPathsFromManifest(formatEntries);
    await updatePackageJsonExports(exportEntries);

    console.log(`✓ Successfully synced ${ksyFiles.length} .ksy files`);
    console.log(`✓ Generated manifest.json with nested structure`);
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
