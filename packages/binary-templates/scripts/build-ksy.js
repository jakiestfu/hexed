import { readdir, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");
const ksyDir = join(packageRoot, "src", "ksy");
const generatedDir = join(packageRoot, "src", "generated");

async function buildKsyFiles() {
  try {
    // Ensure generated directory exists
    await mkdir(generatedDir, { recursive: true });

    // Find all .ksy files
    const files = await readdir(ksyDir);
    const ksyFiles = files.filter((file) => file.endsWith(".ksy"));

    if (ksyFiles.length === 0) {
      console.log("No .ksy files found in src/ksy/");
      return;
    }

    console.log(`Found ${ksyFiles.length} .ksy file(s) to compile`);

    // Compile each .ksy file
    for (const ksyFile of ksyFiles) {
      const inputPath = join(ksyDir, ksyFile);

      console.log(`Compiling ${ksyFile}...`);

      try {
        // Run kaitai-struct-compiler
        // -t javascript: generate javascript
        // Output directory is passed as a positional argument after the input file
        execSync(
          `kaitai-struct-compiler -t javascript "${inputPath}" --outdir "${generatedDir}"`,
          { stdio: "inherit", cwd: packageRoot }
        );
        console.log(`✓ Successfully compiled ${ksyFile}`);
      } catch (error) {
        console.error(`✗ Failed to compile ${ksyFile}:`, error.message);
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
