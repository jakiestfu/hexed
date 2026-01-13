import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths relative to this script
const packageRoot = resolve(__dirname, "..");
const srcDir = join(packageRoot, "src");
const distDir = join(packageRoot, "dist");
const entryPoint = join(srcDir, "worker.ts");
const outputFile = join(distDir, "worker.js");
const typesPackagePath = resolve(packageRoot, "../../packages/types/src");

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

async function buildWorker() {
  try {
    console.log("Building worker...");
    console.log(`Entry: ${entryPoint}`);
    console.log(`Output: ${outputFile}`);

    await build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: outputFile,
      format: "esm",
      platform: "browser",
      target: "es2022",
      sourcemap: false,
      minify: false,
      // Handle imports from workspace packages by aliasing to source
      alias: {
        "@hexed/types": typesPackagePath,
      },
      // Don't externalize anything - bundle everything
      external: [],
      // Ensure proper module resolution
      mainFields: ["module", "main"],
      conditions: ["import", "module"],
      banner: {
        js: "// SharedWorker bundle - built with esbuild",
      },
      // Resolve node_modules
      nodePaths: [resolve(packageRoot, "../../node_modules")],
    });

    console.log("✓ Worker built successfully");
    console.log(`  Output: ${outputFile}`);
  } catch (error) {
    console.error("Failed to build worker:", error);
    process.exit(1);
  }
}

buildWorker();
