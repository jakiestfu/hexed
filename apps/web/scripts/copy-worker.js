import { copyFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths relative to this script
const webAppRoot = resolve(__dirname, "..");
const workerDistPath = resolve(webAppRoot, "../../packages/worker/dist/worker.js");
const publicWorkersDir = join(webAppRoot, "public", "workers");
const targetWorkerPath = join(publicWorkersDir, "worker.js");

async function copyWorker() {
  try {
    // Check if worker dist file exists
    if (!existsSync(workerDistPath)) {
      console.error(`Worker dist file not found: ${workerDistPath}`);
      console.error("Please run 'pnpm --filter @hexed/worker build' first");
      process.exit(1);
    }

    // Ensure public/workers directory exists
    if (!existsSync(publicWorkersDir)) {
      await mkdir(publicWorkersDir, { recursive: true });
      console.log(`Created directory: ${publicWorkersDir}`);
    }

    // Copy worker file
    await copyFile(workerDistPath, targetWorkerPath);
    console.log("✓ Worker copied successfully");
    console.log(`  From: ${workerDistPath}`);
    console.log(`  To: ${targetWorkerPath}`);
  } catch (error) {
    console.error("Failed to copy worker:", error);
    process.exit(1);
  }
}

copyWorker();
